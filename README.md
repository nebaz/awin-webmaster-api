# awin.com API Integration

## Installation

To use the library, install it through [npm](https://npmjs.com)

```shell
npm install --save awin-webmaster-api
```

## Get API token here
* https://ui.awin.com/awin-api

## Get your userId here
* https://ui.awin.com/user

## Usage
    const AwinApi = require('awin-webmaster-api');
    const api = new AwinApi(userId, token);
    let awinOffers = await api.getOffersData('ES');

## API
* getOffersData(string countryCode?, string relationship?): Object
* getLeadsByOfferId(timestamp dateFrom, timestamp dateTo, int offerId?): Object
* getStatisticsOffers(timestamp dateFrom, timestamp dateTo, int offerId?, array regions): Object
* getStatisticsOffersByRegion(timestamp dateFrom, timestamp dateTo, int offerId?, string region): Object
* getOfferLinkByOfferId(int offerId): Object
* apiRequest(method) - native awin api request

