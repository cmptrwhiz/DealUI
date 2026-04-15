# Deal Engine UI

React + Vite app for running a quick real estate deal score.

## Scripts

```sh
npm start
```

Starts the local dev server.

```sh
npm run build
```

Builds the production bundle into `dist/`.

```sh
npm run preview
```

Serves the production bundle locally.

## API

By default the app scores deals locally in the browser. To use a backend scorer,
set `VITE_DEAL_API_URL` to the service base URL; the UI will post to `/score`.
