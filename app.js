const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors');
const app = express()
app.use(cors());
const db = require('./queries')
const port = 3000

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
      extended: true,
    })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/stories', db.getStories);
app.get('/story/:id', db.getStoryById);
app.get('/stories-end/:ite', db.getEndedStories);
app.get('/stories/:ite', db.getCurrentStories);
app.get('/contents/:id', db.getStoryContents);
app.get('/contents-child/:id', db.getContentChilds);

app.post('/story', db.createStory);
app.post('/content/:id', db.addContentToNewStory);
app.post('/content-child/:id', db.addContentChild);

//app.put('/story', db.updateStory);


app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
