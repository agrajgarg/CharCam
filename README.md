# CharCam

A client-only ASCII camera built with Vite, React, and TypeScript. It requests local camera access, converts frames into live ASCII art, and exports still frames as PNG or text.

## Run locally

```bash
npm install
npm run dev
```

Camera access requires `https` or `localhost`. The Vite dev server uses localhost, so it works for local development.

## Build

```bash
npm run build
```

## Deployment

Pushes to `main` deploy through GitHub Actions to S3 + CloudFront.
