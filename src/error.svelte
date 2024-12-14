<script>
    export let error; // The error object
    export let status; // The HTTP status code
  </script>
  
  <h1>{status}</h1>
  <p>{error.message}</p>
  