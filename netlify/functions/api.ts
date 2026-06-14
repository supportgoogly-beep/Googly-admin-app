import serverless from "serverless-http";

// Need to export the handler. We'll wrap it in a function because we need dynamic import
let handlerInstance: any;

export const handler = async (event: any, context: any) => {
  if (!handlerInstance) {
    process.env.SERVERLESS = "true";
    const { app } = await import("../../server");
    handlerInstance = serverless(app, {
      basePath: '/.netlify/functions'
    });
  }
  return handlerInstance(event, context);
};
