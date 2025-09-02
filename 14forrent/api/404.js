// Vercel serverless function to handle 404 errors with proper status code
export default function handler(req, res) {
  res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>404 - Page Not Found | 14ForRent</title>
  <meta name="description" content="The page you are looking for could not be found. Browse our available rental properties or return to the homepage.">
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f3f4f6;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .error-code {
      font-size: 6rem;
      font-weight: bold;
      color: #1a2953;
      margin: 0;
    }
    .error-message {
      font-size: 1.5rem;
      color: #1a2953;
      margin: 1rem 0;
    }
    .error-description {
      font-size: 1rem;
      color: #6b7280;
      margin-bottom: 2rem;
      max-width: 400px;
    }
    .home-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #1a2953;
      color: white;
      text-decoration: none;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .home-button:hover {
      background: #2a3963;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="error-code">404</h1>
    <h2 class="error-message">Page Not Found</h2>
    <p class="error-description">
      Sorry, the rental property you're looking for doesn't exist or has been leased.
    </p>
    <a href="/" class="home-button">Return to Home</a>
  </div>
  <script>
    // Redirect to React app's 404 page after a brief delay
    setTimeout(function() {
      window.location.href = '/not-found';
    }, 100);
  </script>
</body>
</html>`);
}