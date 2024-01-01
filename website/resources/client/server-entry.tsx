import {renderToPipeableStream} from 'react-dom/server';
import {BootstrapData} from '@common/core/bootstrap-data/bootstrap-data';
import process from 'process';
import {
  createServer as createHttpServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import {setBootstrapData} from '@common/core/bootstrap-data/use-backend-bootstrap-data';
import {StaticRouter} from 'react-router-dom/server';
import {CommonProvider} from '@common/core/common-provider';
import {AppRoutes} from '@app/app-routes';
import {queryClient} from '@common/http/query-client';

const port = 13714;

interface Data {
  bootstrapData: BootstrapData;
  url: string;
}

const readableToString: (
  readable: IncomingMessage
) => Promise<string> = readable =>
  new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', chunk => (data += chunk));
    readable.on('end', () => resolve(data));
    readable.on('error', err => reject(err));
  });

createHttpServer(async (request, response) => {
  if (request.url === '/render') {
    return render(request, response);
  } else {
    return handleOtherRoutes(request, response);
  }
}).listen(port, () => console.log('SSR server started.'));

async function render(request: IncomingMessage, response: ServerResponse) {
  const payload = await readableToString(request);
  const data = (payload ? JSON.parse(payload) : {}) as Data;

  setBootstrapData(data.bootstrapData);

  const {pipe, abort} = renderToPipeableStream(
    <StaticRouter location={data.url}>
      <CommonProvider>
        <AppRoutes />
      </CommonProvider>
    </StaticRouter>,
    {
      onAllReady() {
        response.setHeader('content-type', 'text/html');
        pipe(response);
        // clear query client to avoid memory leaks and to avoid data from being shared between requests
        queryClient.clear();
        response.end();
      },
    }
  );

  // abort after 2 seconds, if rendering takes longer than that
  setTimeout(() => {
    abort();
  }, 2000);
}

function handleOtherRoutes(request: IncomingMessage, response: ServerResponse) {
  let data = {};

  if (request.url === '/health') {
    data = {status: 'OK', timestamp: Date.now()};
  } else if (request.url === '/shutdown') {
    process.exit();
  } else {
    data = {status: 'NOT_FOUND', timestamp: Date.now()};
  }

  try {
    response.writeHead(200, {
      'Content-Type': 'application/json',
    });
    response.write(JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }

  response.end();
}

console.log(`Starting SSR server on port ${port}...`);
