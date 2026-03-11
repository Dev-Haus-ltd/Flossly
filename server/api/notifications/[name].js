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
import { Op } from 'sequelize';

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

    console.log(`📥 [FCM] Received token from user ${userId}: ${token.substring(0, 50)}... (device: ${deviceType}, browser: ${browser})`);

    // Check if token already exists
    const existingToken = await FcmToken.findOne({
      where: { token }
    });

    if (existingToken) {
      if (existingToken.userId === userId) {
        console.log(`🔄 [FCM] Updating existing token for same user`);
        await existingToken.update({
          deviceType,
          browser,
          deviceInfo,
          isActive: true,
          lastUsedAt: new Date()
        });

        return success({ 
          message: 'Token updated successfully', 
          tokenId: existingToken.id,
          action: 'updated'
        });
      } else if (!existingToken.isActive) {
        console.log(`♻️ [FCM] Reassigning inactive token from user ${existingToken.userId} to user ${userId}`);
        await existingToken.update({
          userId,
          deviceType,
          browser,
          deviceInfo,
          isActive: true,
          lastUsedAt: new Date()
        });

        return success({ 
          message: 'Inactive token reassigned successfully', 
          tokenId: existingToken.id,
          action: 'reassigned'
        });
      } else {
        console.warn(`⚠️ [FCM] Token transfer detected! Token was active for user ${existingToken.userId}, now being used by user ${userId}. Deactivating old token.`);
        await existingToken.update({ isActive: false });
        
        const newToken = await FcmToken.create({
          userId,
          token,
          deviceType,
          browser,
          deviceInfo,
          isActive: true,
          lastUsedAt: new Date()
        });

        return success({ 
          message: 'Token ownership transferred', 
          tokenId: newToken.id,
          action: 'transferred',
          warning: 'Token was active for another user'
        });
      }
    } else {
      console.log(`🆕 [FCM] Creating new token for user ${userId}`);
      const newToken = await FcmToken.create({
        userId,
        token,
        deviceType,
        browser,
        deviceInfo,
        isActive: true,
        lastUsedAt: new Date()
      });

      return success({ 
        message: 'Token saved successfully', 
        tokenId: newToken.id,
        action: 'created'
      });
    }
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return error(500, {
      message: err.message,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
    
    // Get current organisation from user context
    const user = event.context.user;
    const organisationId = user?.organisationId || user?.orgId || null;
    
    console.log('📋 [NOTIFICATIONS API] Fetching notifications for userId:', userId, 'orgId:', organisationId);

    const result = await getUserNotifications(userId, { limit, offset, unreadOnly, organisationId });

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
    // Get current organisation from user context
    const user = event.context.user;
    const organisationId = user?.organisationId || user?.orgId || null;
    
    const where = { userId, isRead: false };
    
    // Mark both org-specific AND global (null org) notifications as read
    // Global notifications should be marked as read across all organizations
    if (organisationId) {
      where[Op.or] = [
        { organisationId: organisationId },
        { organisationId: null }
      ];
    }
    
    await UserNotification.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where
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
    // Get current organisation from user context
    const user = event.context.user;
    const organisationId = user?.organisationId || user?.orgId || null;
    
    console.log('🔔 [NOTIFICATIONS API] Fetching unread count for userId:', userId, 'orgId:', organisationId);
    
    const where = {
      userId,
      isRead: false
    };
    
    // Include notifications for current org OR global notifications (null org)
    if (organisationId) {
      where[Op.or] = [
        { organisationId: organisationId },
        { organisationId: null }
      ];
    }
    
    const count = await UserNotification.count({ where });

    return success({ unreadCount: count });
  } catch (err) {
    console.error('Error getting unread count:', err);
    return error(500, err.message);
  }
}
