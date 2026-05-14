import { getRewardPonits } from '../../../../controllers/points';
import { error } from '../../../../utils/response';

export default defineEventHandler(async (event) => {
  if (!event.context.admin) {
    return error(403, 'Admin access required');
  }
  return await getRewardPonits(event);
});
