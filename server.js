const express = require('express');

// initialise app varibale with express
const app = express();

app.get('/', (req, res) => res.send('API running'));

// looks for an env variable called PORT;
const PORT = process.env.PORT || 5000;

// listen on a port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
