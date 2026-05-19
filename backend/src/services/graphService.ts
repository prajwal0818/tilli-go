import axios from 'axios';
import logger from '../config/logger';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function fetchProfilePhoto(
  accessToken: string,
): Promise<string | null> {
  try {
    const response = await axios.get<ArrayBuffer>(
      `${GRAPH_BASE}/me/photo/$value`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'arraybuffer',
        timeout: 10000,
      },
    );
    const base64 = Buffer.from(response.data).toString('base64');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.info('User has no Microsoft profile photo');
      return null;
    }
    logger.warn(
      { err: error.message },
      'Failed to fetch Microsoft profile photo',
    );
    return null;
  }
}
