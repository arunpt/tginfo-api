// usage: http://localhost:3000/info/telegram

const express = require('express');
const axios = require('axios').default;
const cheerio = require('cheerio');
const cors = require('cors');
const morgan = require('morgan');

const app = express()
app.set('json spaces', 3)
app.use(morgan('short'));
app.use(cors());
const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
   res.json({ message: "running" })
})


const getChatType = (text) => {
   switch (true) {
      case /members|online/.test(text):
         return 'group/supergroup';
      case /subscribers/.test(text):
         return 'channel';
      case /bot$/.test(text):
         return 'bot';
      default:
         return 'private';
   }
}


app.get('/info/:entity', async (req, res) => {
   const entity = req.params.entity;
   if (entity.length < 5)
      return res.json({ message: 'not a valid username' }).status(400);
   var chatURL = `https://telegram.me/${entity}`;
   const response = await axios.get(chatURL);
   const $ = cheerio.load(response.data);
   if ($('div.tgme_page').length) {
      var data = {};
      var title = $('div.tgme_page_title')
      if (!title.length) return res.json({
         message: 'entity not found'
      }).status(404);
      data.title = title.text().trim();
      data.description = $('div.tgme_page_description').text().trim();
      var subText = $('div.tgme_page_extra').text().trim();
      data.photo = $('img.tgme_page_photo_image').attr('src');
      data.type = getChatType(subText);
      if (subText.includes('online'))
         data.online = Number(subText.match(/([\d ]+) online/)[1].replace(/ /g, ''));
      if (subText.match(/members?|subscribers?/))
         data.members = Number(subText.match(/^([\d ]+)/)[0].replace(/ /g, ''));
      data.link = chatURL;
      res.json(data);
   } else {
      res.json({ message: 'something went wrong' }).status(500);
   }
})

app.listen(port, () => {
   console.log(`app listening on port ${port}`)
})