// Simple serverless function to check if the site is up
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: "ok", message: "Project Manager API is working" })
  };
};