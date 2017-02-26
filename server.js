const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

const {DATABASE_URL, PORT} = require('./config');
const {Restaurant} = require('./models');
//const {cuisineFreq, createBoroughObject} = require('./dataHandler');

mongoose.Promise = global.Promise;
const app = express();
app.use(bodyParser.json());


app.get('/restaurants/:borough', (req, res) => {
  Restaurant
    .find({"borough":{"$eq" : req.params.borough}})
    .exec()
    .then(response => {
      const dataObj = cuisineFreq(response);
      return res.json(dataObj);
    });
});

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};
function createBoroughObject (item) {
  const boroughObj = {};
  let data = []
  item.forEach(x => {
    let cuisine = x.cuisine;
    boroughObj[cuisine] = boroughObj[cuisine] ? boroughObj[cuisine] + 1 : 1;
  });
  for (let prop in boroughObj) {
    if(!(prop === "Other" || prop === "American")){
        data.push({"name": prop, "value": boroughObj[prop]});
    }
  }
  return data.sort((a,b) => b.value - a.value).slice(0,10);

}

function cuisineFreq (item) {
   return createBoroughObject(item);
};


module.exports = {app, runServer, closeServer};
