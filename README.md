# ERIS Prediction Dashboard

Reuse the existing ERIS API client and authenticated session. For individual analysis, call POST /api/ai/employees/:employeeId/predict with the selected snapshotId and the existing save option. For batch analysis, call POST /api/ai/predict-batch using the verified request shape. Bind the dashboard to the returned score, SHAP contributions, and input snapshot. Use the existing result and policy APIs for saved predictions.

The ERIS backend owns the connection to the existing Mexwell model. Keep AI_SERVICE_KEY server-side and route all prediction requests through the ERIS backend. If the API is unreachable in preview, show its unavailable state. In FRONTEND_HANDOFF.md, record the frontend API base URL setting, the functions wired to each route, and any calls Codex still needs to verify locally.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd8f7eb9-2f99-479f-8855-a38c6fef310a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
