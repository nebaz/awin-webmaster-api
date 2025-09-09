const fetch = require('node-fetch');
const API_URL = 'https://api.awin.com/';
const STATUS_REJECTED = 'rejected';
const STATUS_OPEN = 'open';
const STATUS_APPROVED = 'approved';

class AwinApi {

  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
  }

  async getOffersData(countryCode, relationship) {
    let method = 'publishers/' + this.userId + '/programmes?';
    if (countryCode) {
      method += 'countryCode=' + countryCode + '&';
    }
    if (relationship) {
      method += 'relationship=' + relationship + '&';
    }
    return await this.apiRequest(method);
  }

  // https://developer.awin.com/apidocs/returns-a-list-of-transactions-for-a-given-publisher
  async getLeadsByOfferId(dateFrom, dateTo, offerId = null) {
    dateFrom = this.#formatDate(dateFrom);
    dateTo = this.#formatDate(dateTo);
    let method = 'publishers/' + this.userId + '/transactions/?';
    method += 'startDate=' + dateFrom + 'T00:00:00&';
    method += 'endDate=' + dateTo + 'T00:00:00&';
    if (offerId) {
      method += 'advertiserId=' + offerId + '&';
    }
    let apiData = await this.apiRequest(method);

    if (apiData.ok && Array.isArray(apiData.result)) {
      apiData.result.map(it => {
        it.orderId = it.id.toString();
        it.offerId = it.advertiserId;
        it.status = this.#getLeadStatus(it.commissionStatus);
        it.commission = it.commissionAmount.amount;
        it.currency = it.commissionAmount.currency;
        it.subaccount = it.clickRefs?.clickRef;
        it.subaccount2 = it.clickRefs?.clickRef2;
        it.subaccount3 = it.clickRefs?.clickRef3;
        it.subaccount4 = it.clickRefs?.clickRef4;
        it.leadTime = new Date(it.transactionDate).valueOf();
      });
    }
    return apiData;
  }

  /**
   * short grouped statistics combined for all regions
   * @return {ok: boolean, result: Array {offerId,clicks,leadsOpen,commissionOpen,...}}
   */
  async getStatisticsOffers(dateFrom, dateTo, offerId, regions = []) {
    let result = {ok: true, result: []};
    if (!regions.length) {
      return {ok: false, errorMessage: 'regions are mandatory'};
    }
    for (let region of regions) {
      let apiData = await this.getStatisticsOffersByRegion(dateFrom, dateTo, offerId, region);
      if (!apiData.ok) {
        return apiData;
      }
      result.result = result.result.concat(apiData.result);
    }
    return result;
  }

  /**
   * short grouped statistics
   */
  async getStatisticsOffersByRegion(dateFrom, dateTo, offerId, region) {
    dateFrom = this.#formatDate(dateFrom);
    dateTo = this.#formatDate(dateTo);
    let method = 'publishers/' + this.userId + '/reports/advertiser?';
    method += 'startDate=' + dateFrom + '&';
    method += 'endDate=' + dateTo + '&';
    method += 'region=' + region + '&';
    let apiData = await this.apiRequest(method);
    if (apiData.ok) {
      apiData.result = apiData.result.map(it => ({
        offerId: Number(it.advertiserId),
        offerName: it.advertiserName,
        currency: it.currency,
        clicks: it.clicks || 0,
        leads: (it.declinedNo || 0) + (it.pendingNo || 0) + (it.confirmedNo || 0),
        leadsRejected: it.declinedNo || 0,
        leadsOpen: it.pendingNo || 0,
        leadsApproved: it.confirmedNo || 0,
        commissionRejected: it.declinedComm || 0,
        commissionOpen: it.pendingComm || 0,
        commissionApproved: it.confirmedComm || 0,
        cr: it.clicks ? Math.round(it.totalNo / it.clicks * 10000) / 100 : 0,
        ar: it.totalNo ? Math.round(it.confirmedNo / it.totalNo * 10000) / 100 : 0
      }));
      if (offerId) {
        apiData.result = apiData.result.filter(it => it.offerId === offerId);
      }
    }
    return apiData;
  }

  getOfferLinkByOfferId(offerId) {
    return {ok: true, result: 'https://www.awin1.com/awclick.php?id=' + this.userId + '&mid=' + offerId};
  }

  #formatDate(timestamp) {
    let mm = new Date(timestamp).getMonth() + 1;
    let dd = new Date(timestamp).getDate();
    return [new Date(timestamp).getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
  }

  #getLeadStatus(status) {
    switch (status) {
      case 'declined':
        return STATUS_REJECTED;
      case 'pending':
        return STATUS_OPEN;
      case 'approved':
        return STATUS_APPROVED;
      default:
        return status;
    }
  }

  async apiRequest(method) {
    // console.info('AwinApiRequest', new Date().toLocaleString(), method);
    let result;
    try {
      result = await (await fetch(API_URL + method, {
        method: 'GET',
        headers: {'authorization': 'Bearer ' + this.token}
      })).json();
    } catch (e) {
      console.error('awin api error', e);
    }
    // console.info('AwinApiRequest', new Date().toLocaleString(), result);
    if (!result || result.error) {
      console.error('awin api error: ', result);
      return {ok: false, errorMessage: result?.error};
    }
    return {ok: true, result: result};
  }

}

module.exports = AwinApi;
