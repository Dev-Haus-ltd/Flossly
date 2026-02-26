import { 
  sendNotificationToUser, 
  sendNotificationToMultipleUsers, 
  markNotificationAsRead, 
  getUserNotifications,
  initializeFirebaseAdmin 
} from '../../utils/fcmNotification';
import { FcmToken, UserNotification } from '../../models';
import { error, success } from '../../utils/response';
import { getQuery, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const name = event.context.params.name;
  
  try {
    const user = event.context.user;
    if (!user) {
      return error(401, 'Unauthorized');
    }
    const userId = user.userId || user.id;

    switch (name) {
      case 'save-token':
        return await saveToken(event, userId);
      
      case 'delete-token':
        return await deleteToken(event, userId);
      
      case 'get-notifications':
        return await getNotifications(event, userId);
      
      case 'mark-read':
        return await markAsRead(event, userId);
      
      case 'mark-all-read':
        return await markAllAsRead(event, userId);
      
      case 'send-test':
        return await sendTestNotification(event, userId);
      
      case 'get-unread-count':
        return await getUnreadCount(event, userId);
      
      default:
        return error(404, 'Endpoint not found');
    }
  } catch (err) {
    console.error(`Error in notifications/${name}:`, err);
    return error(500, err.message || 'Internal server error');
  }
});

// Save FCM token
async function saveToken(event, userId) {
  try {
    const { token, deviceType, browser, deviceInfo } = await readBody(event);

    if (!token) {
      return error(400, 'Token is required');
    }

    // Check if token already exists
    const existingToken = await FcmToken.findOne({
      where: { token }
    });

    if (existingToken) {
      // Update existing token
      await existingToken.update({
        userId,
        deviceType,
        browser,
        deviceInfo,
        isActive: true,
        lastUsedAt: new Date()
      });

      return success({ message: 'Token updated successfully', tokenId: existingToken.id });
    } else {
      // Create new token
      const newToken = await FcmToken.create({
        userId,
        token,
        deviceType,
        browser,
        deviceInfo,
        isActive: true,
        lastUsedAt: new Date()
      });

      return success({ message: 'Token saved successfully', tokenId: newToken.id });
    }
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return error(500, err.message);
  }
}

// Delete FCM token
async function deleteToken(event, userId) {
  try {
    const { token } = await readBody(event);

    if (!token) {
      return error(400, 'Token is required');
    }

    const result = await FcmToken.destroy({
      where: {
        token,
        userId
      }
    });

    if (result > 0) {
      return success({ message: 'Token deleted successfully' });
    } else {
      return error(404, 'Token not found');
    }
  } catch (err) {
    console.error('Error deleting FCM token:', err);
    return error(500, err.message);
  }
}

// Get user notifications
async function getNotifications(event, userId) {
  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit) || 50;
    const offset = parseInt(query.offset) || 0;
    const unreadOnly = query.unreadOnly === 'true';

    const result = await getUserNotifications(userId, { limit, offset, unreadOnly });

    if (result.success) {
      return success(result);
    } else {
      return error(500, result.error);
    }
  } catch (err) {
    console.error('Error getting notifications:', err);
    return error(500, err.message);
  }
}

// Mark notification as read
async function markAsRead(event, userId) {
  try {
    const { notificationId } = await readBody(event);

    if (!notificationId) {
      return error(400, 'Notification ID is required');
    }

    const result = await markNotificationAsRead(notificationId, userId);

    if (result.success) {
      return success({ message: 'Notification marked as read' });
    } else {
      return error(404, result.message || result.error);
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return error(500, err.message);
  }
}

// Mark all notifications as read
async function markAllAsRead(event, userId) {
  try {
    await UserNotification.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );

    return success({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return error(500, err.message);
  }
}

// Send test notification
async function sendTestNotification(event, userId) {
  try {
    // Initialize Firebase Admin if not already done
    initializeFirebaseAdmin();

    const result = await sendNotificationToUser({
      userId,
      title: 'Test Notification',
      body: 'This is a test notification from FlosslyOS',
      type: 'test',
      data: {
        url: '/'
      },
      priority: 'medium'
    });

    if (result.success) {
      return success({ 
        message: 'Test notification sent successfully',
        details: result
      });
    } else {
      return error(500, result.message || 'Failed to send notification');
    }
  } catch (err) {
    console.error('Error sending test notification:', err);
    return error(500, err.message);
  }
}

// Get unread notification count
async function getUnreadCount(event, userId) {
  try {
    const count = await UserNotification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return success({ unreadCount: count });
  } catch (err) {
    console.error('Error getting unread count:', err);
    return error(500, err.message);
  }
}
