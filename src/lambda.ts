import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generate } from './generate';
import { audit } from './audit';
import { gate } from './gate';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const path = event.path || event.requestContext?.path || '';

  let body: Record<string, any> = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'error', message: 'Invalid JSON in request body' }),
    };
  }

  try {
    let result: any;
    let statusCode = 200;

    if (path.includes('/generate')) {
      const output = await generate({ jurisdiction: body.jurisdiction, output: body.output });
      result = { status: 'ok', message: 'Steering file generated', data: output };
    } else if (path.includes('/audit')) {
      const output = await audit({ commit: body.commit, steering: body.steering });
      result = { status: 'ok', message: 'Audit complete', data: output };
    } else if (path.includes('/gate')) {
      const output = await gate({ pr: body.pr, materiality: body.materiality, blockOn: body.blockOn });
      result = { status: 'ok', message: 'Gate passed', data: output };
    } else {
      statusCode = 404;
      result = { status: 'error', message: 'Unknown endpoint' };
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Lambda error:', err);
    return {
      statusCode: err.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'error',
        message: err.statusCode === 400 ? err.message : 'Internal error',
      }),
    };
  }
};
