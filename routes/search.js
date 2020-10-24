var express = require('express');
var router = express.Router();
const axios = require('axios');
var transform = require('camaro');
var cors = require('cors');
const { route } = require('../app');
//store
var mainResponse = {
  term: null,
  itunes: null,
  tvmaze: null,
  crcind: null,
  create: async function(term) {
    mainResponse.term = term;
    await itunes(term);
    await tvmaze(term);
    await crcind(term);
  },
  filter: function () {
    //filtering itunes
    if(mainResponse.itunes != null){
      mainResponse.itunes = mainResponse.itunes.filter(obj => {
        return obj.artistName.toLowerCase().search(mainResponse.term.toLowerCase()) >= 0 
      });
      mainResponse.itunes = mainResponse.itunes.map(obj => obj.artistName).sort();
    }
    //filtering tvmaze
    if(mainResponse.tvmaze != null){
      mainResponse.tvmaze = mainResponse.tvmaze.filter(obj => {
        return obj.show.name.toLowerCase().search(mainResponse.term.toLowerCase()) >= 0
      });
      mainResponse.tvmaze = mainResponse.tvmaze.map(obj => obj.show.name).sort();
    }
    //filtering crcind
    if(mainResponse.crcind != null){
      mainResponse.crcind = mainResponse.crcind.filter(obj => {
        return obj.Name.toLowerCase().search(mainResponse.term.toLowerCase()) >= 0
      });
      mainResponse.crcind = mainResponse.crcind.map(obj => obj.Name).sort();
    }
  }
}
//Main functions
async function itunes (term){
  await axios.get('https://itunes.apple.com/search',{
    params: {
      term: term,
      //categories  
      media: ["movie","music","ebook"]
    }
  })
    .then(response => {
      mainResponse.itunes = response.data.results;
    }).catch((e) => console.log('error itunes'))
}
async function tvmaze (term){
  await axios.get(' http://api.tvmaze.com/search/shows',{
    params: {
      q: term
    }
  })
    .then(response => {
      mainResponse.tvmaze = response.data;
    }).catch((e) => console.log('error tvmaze'))
}
async function crcind (term){
  await axios.get('https://www.crcind.com/csp/samples/SOAP.Demo.cls',{
    params: {
      soap_method: 'GetListByName',
      name: term
    }
  })
    .then(response => {
      //model of soap response
      const template = {
        PersonIdentification: ['//PersonIdentification', {
          Name: 'Name'
        }]
      }
      mainResponse.crcind = transform(response.data, template).PersonIdentification;
    }).catch((e) => console.log('error crcind'))
}
/*central search*/
router.use(cors());
router.get('/search',async function(req, res) {
  try {
    await mainResponse.create(req.query.term);
  } catch (error) {
    res.status(500).send('Something broke!');
  }
  mainResponse.filter();
  res.send(mainResponse);
});

module.exports = router;
