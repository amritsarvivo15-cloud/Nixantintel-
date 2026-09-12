"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/radarApi.ts
var radarApi_exports = {};
__export(radarApi_exports, {
  createRadarApp: () => createRadarApp
});
module.exports = __toCommonJS(radarApi_exports);
var import_express = __toESM(require("express"), 1);
var import_genai = require("@google/genai");

// src/data/portfolioData.ts
var PORTFOLIO_DATA = [
  { "org": "1130296", "domain": "v1v86paneuzxtbo5u7.com", "channel": "SME+", "orgname": "v1v86paneuzxtbo5u7.com", "jul": 483853, "aug": 662323, "sep": 7484, "status": "Matched", "total": 1153660 },
  { "org": "73455", "domain": "innefu.com", "channel": "SME+", "orgname": "Innefu Labs Pvt Ltd", "jul": 386585, "aug": 641836, "sep": 62309, "status": "Matched", "total": 1090730 },
  { "org": "127055", "domain": "arista.com", "channel": "SME+", "orgname": "Arista Networks India Pvt Ltd", "jul": 558116, "aug": 518869, "sep": 37186, "status": "Matched", "total": 1114171 },
  { "org": "189397", "domain": "sunlightsports.co.in", "channel": "SEM", "orgname": "Sunlight Sports Pvt Ltd", "jul": 202108, "aug": 461029, "sep": 0, "status": "Matched", "total": 663137 },
  { "org": "167344", "domain": "dinamicoil.com", "channel": "SME+", "orgname": "Dinamic Oil", "jul": 52068, "aug": 391022, "sep": 13993, "status": "Matched", "total": 457083 },
  { "org": "113574", "domain": "intervue.io", "channel": "SME+", "orgname": "Climate Techno Services", "jul": 195960, "aug": 281125, "sep": 0, "status": "Matched", "total": 477085 },
  { "org": "113574", "domain": "hyperfilteration.com", "channel": "SME+", "orgname": "Climate Techno Services", "jul": 195960, "aug": 281125, "sep": 0, "status": "Matched", "total": 477085 },
  { "org": "1001262", "domain": "nestasia.in", "channel": "SEM", "orgname": "New Leaf Retail Technologies", "jul": 202411, "aug": 274325, "sep": 0, "status": "Matched", "total": 476736 },
  { "org": "103727", "domain": "ostwal.in", "channel": "SEM", "orgname": "Krishana Phoschem Ltd", "jul": 172481, "aug": 269547, "sep": 14015, "status": "Matched", "total": 456043 },
  { "org": "27873", "domain": "kvfire.com", "channel": "SME+", "orgname": "KV Fire Chemicals India", "jul": 77859, "aug": 236825, "sep": 6821, "status": "Matched", "total": 321505 },
  { "org": "104705", "domain": "neurosynaptic.com", "channel": "SME+", "orgname": "Neurosynaptic Communications", "jul": 107397, "aug": 232489, "sep": 0, "status": "Matched", "total": 339886 },
  { "org": "110533", "domain": "gdxgroup.in", "channel": "SME+", "orgname": "GDX Facility & Management Services", "jul": 206240, "aug": 231779, "sep": 19426, "status": "Matched", "total": 457445 },
  { "org": "317630", "domain": "zyla.in", "channel": "SME+", "orgname": "Zyla Health Pvt Ltd", "jul": 147265, "aug": 202119, "sep": 9330, "status": "Matched", "total": 358714 },
  { "org": "1521656", "domain": "cfpl.net.in", "channel": "SME+", "orgname": "Chatha Foods Ltd", "jul": 243023, "aug": 201016, "sep": 16464, "status": "Matched", "total": 460503 },
  { "org": "318934", "domain": "nihva.com", "channel": "SME+", "orgname": "NIHVA Technologies Pvt Ltd", "jul": 59348, "aug": 197929, "sep": 0, "status": "Matched", "total": 257277 },
  { "org": "1801168", "domain": "websol.co.in", "channel": "SME+", "orgname": "Websol Energy System Ltd", "jul": 218149, "aug": 187281, "sep": 31178, "status": "Matched", "total": 436608 },
  { "org": "2133", "domain": "fortunegroup.org.in", "channel": "SEM", "orgname": "Fortune Metals Ltd", "jul": 206845, "aug": 183940, "sep": 17136, "status": "Matched", "total": 407921 },
  { "org": "415408", "domain": "prasuma.com", "channel": "SME+", "orgname": "Ample Foods Pvt Ltd", "jul": 263697, "aug": 174071, "sep": 0, "status": "Matched", "total": 437768 },
  { "org": "318454", "domain": "7batqpanajips6139d.com", "channel": "SEM", "orgname": "K C S Quality Inspection Pvt Ltd", "jul": 183411, "aug": 174154, "sep": 0, "status": "Matched", "total": 357565 },
  { "org": "957", "domain": "maestro-control.com", "channel": "SME+", "orgname": "Beijer Electronics Technologies", "jul": 78137, "aug": 171594, "sep": 1970, "status": "Matched", "total": 251701 },
  { "org": "3818", "domain": "biltechindia.com", "channel": "SEM", "orgname": "Biltech Building Elements Ltd", "jul": 107871, "aug": 159368, "sep": 0, "status": "Matched", "total": 267239 },
  { "org": "167933", "domain": "repcohome.com", "channel": "SMEV", "orgname": "Repco Home Finance Ltd", "jul": 38172, "aug": 155736, "sep": 0, "status": "Matched", "total": 193908 },
  { "org": "61572", "domain": "vapcoengineers.com", "channel": "SME+", "orgname": "Vapco Engineers Pvt Ltd", "jul": 48375, "aug": 115685, "sep": 10296, "status": "Matched", "total": 174356 },
  { "org": "419088", "domain": "auricmotors.com", "channel": "SEM", "orgname": "Audi Motors Pvt Ltd", "jul": 178463, "aug": 114228, "sep": 0, "status": "Matched", "total": 292691 },
  { "org": "404352", "domain": "datoms.io", "channel": "SME+", "orgname": "Phoenix Robotix Pvt Ltd", "jul": 339438, "aug": 90948, "sep": 2495, "status": "Matched", "total": 432881 },
  { "org": "1775410", "domain": "hyoseong.co.in", "channel": "SME+", "orgname": "Hyoseong Electric India Pvt Ltd", "jul": 261007, "aug": 66526, "sep": 0, "status": "Matched", "total": 327533 },
  { "org": "324678", "domain": "katsonlogistics.com", "channel": "SME+", "orgname": "Katson 3PL Services Pvt Ltd", "jul": 31140, "aug": 65364, "sep": 0, "status": "Matched", "total": 96504 },
  { "org": "937862", "domain": "nisiki.net.in", "channel": "SME+", "orgname": "Nisiki India Pvt Ltd", "jul": 129593, "aug": 63495, "sep": 0, "status": "Matched", "total": 193088 },
  { "org": "186235", "domain": "ispirt.in", "channel": "SME+", "orgname": "Tanuj Bhojwani / iSPIRT", "jul": 163192, "aug": 52096, "sep": 0, "status": "Matched", "total": 215288 },
  { "org": "160271", "domain": "whitecrowresearch.com", "channel": "SME+", "orgname": "White Crow Research Pvt Ltd", "jul": 32848, "aug": 50451, "sep": 0, "status": "Matched", "total": 83299 },
  { "org": "709328", "domain": "arhomes.in", "channel": "SME+", "orgname": "AR Homes", "jul": 38847, "aug": 45081, "sep": 0, "status": "Matched", "total": 83928 },
  { "org": "226888", "domain": "greenchef.in", "channel": "SME+", "orgname": "Greenchef Appliances Ltd", "jul": 461959, "aug": 43918, "sep": 0, "status": "Matched", "total": 505877 },
  { "org": "35083", "domain": "perkinelmer.com", "channel": "SME+", "orgname": "PerkinElmer India Pvt Ltd", "jul": 8281, "aug": 6481, "sep": 0, "status": "Matched", "total": 14762 },
  { "org": "211684", "domain": "triagemeditech.com", "channel": "SME+", "orgname": "Triage Meditech Pvt. Ltd.", "jul": 0, "aug": 8555, "sep": 0, "status": "Matched", "total": 8555 },
  { "org": "23807", "domain": "svagri.co.in", "channel": "SEM", "orgname": "Siddhi Vinayak Agri Processing Pvt. Ltd.", "jul": 33106, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "737966", "domain": "buyofuel.com", "channel": "SME+", "orgname": "Buyo India Pvt. Ltd.", "jul": 169713, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "697980", "domain": "tpslgroup.in", "channel": "SME+", "orgname": "Thakur Prasad Sao & Sons Pvt. Ltd", "jul": 217770, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1435368", "domain": "ibcworldnews.com", "channel": "SME+", "orgname": "Immaculate Broadcasting Consortium World News", "jul": 100471, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "583242", "domain": "synnatpharma.com", "channel": "SME+", "orgname": "Synnat Pharma Private Limited", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "555918", "domain": "moonstoneventures.in", "channel": "SME+", "orgname": "Moonstone Ventures LLP", "jul": 132790, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "276898", "domain": "jpc.co.in", "channel": "SME+", "orgname": "JPC and AcoBloom", "jul": 1872132, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1945678", "domain": "vkglobaldigital.com", "channel": "SME+", "orgname": "VK Global Digital Pvt. Ltd.", "jul": 58427, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "NA", "domain": "tvunetworks.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "No Org ID", "total": null },
  { "org": "48470", "domain": "chambal.in", "channel": "SEM", "orgname": "Chambal Fertilizer and Chemical Limited", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "409750", "domain": "wohrparking.in", "channel": "\u2014", "orgname": "Wohr Parking Systems Pvt. Ltd.", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "64690", "domain": "replurbanplanners.com", "channel": "SME+", "orgname": "Rudrabhishek Enterprises Limited", "jul": 420160, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "70100", "domain": "gsl.in", "channel": "SME+", "orgname": "Ginni Systems Limited", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1889840", "domain": "algothm.com", "channel": "SME+", "orgname": "Algothm", "jul": 53135, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "451940", "domain": "skydo.com", "channel": "SME+", "orgname": "Sykdo Technologies Pvt. Ltd.", "jul": 439752, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "NA", "domain": "merakventures.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "No Org ID", "total": null },
  { "org": "599324", "domain": "orolabs.ai", "channel": "SME+", "orgname": "ORO Software Pvt Ltd", "jul": 556169, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "132841", "domain": "flatworldsolutions.com", "channel": "SEM", "orgname": "Flatworld Solutions", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "2008", "domain": "aamorinox.com", "channel": "SEM", "orgname": "Aamor Inox Limited", "jul": 117169, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1882280", "domain": "sixdengineering.com", "channel": "\u2014", "orgname": "SixD Engineering", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "876112", "domain": "eha-health.org", "channel": "SME+", "orgname": "EHA", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "510490", "domain": "purbasha.in", "channel": "SEM", "orgname": "Aban Beverages Pvt Ltd", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "462472", "domain": "singan.in", "channel": "SME+", "orgname": "Singan Projects Ltd", "jul": 437143, "aug": null, "sep": 35005, "status": "Unmatched", "total": 35005 },
  { "org": "355276", "domain": "kapturecrm.com", "channel": "SME+", "orgname": "Adjetter Media Network", "jul": 495703, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1851108", "domain": "gramaxcybertech.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1817888", "domain": "cosmicpvpower.com", "channel": "SME+", "orgname": "Coamic PV Power Limited", "jul": 46327, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1820818", "domain": "graciouswarehousing.com", "channel": "SME+", "orgname": "Gracious Logistics & Warehousing", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1844226", "domain": "cooldeckindustries.com", "channel": "SME+", "orgname": "Cooldeck Industries", "jul": 27954, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1841248", "domain": "chetakcranes.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1786034", "domain": "alsn.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1104828", "domain": "inverv.com", "channel": "SME+", "orgname": "Kalliope Consulting", "jul": 41559, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "147592", "domain": "esolvegroup.com", "channel": "SME+", "orgname": "E-Solve Infotech", "jul": 21123, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "991816", "domain": "agosaviation.com", "channel": "SME+", "orgname": "AGOS Aviation", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1822732", "domain": "ispschools.com", "channel": "\u2014", "orgname": "International Schools Partnership", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "666012", "domain": "kalaari.com", "channel": "\u2014", "orgname": "Kalaari Capital", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "708058", "domain": "fatakpay.com", "channel": "SME+", "orgname": "Fatakpay Digital", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1066066", "domain": "microgreentech.com", "channel": "SME+", "orgname": "Microgreen Technologies", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1754882", "domain": "swatispentose.com", "channel": "SME+", "orgname": "Swati Spentose", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "741898", "domain": "pradeeprai.com", "channel": "SME+", "orgname": "India Legal Research Foundation", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "877", "domain": "felder-group.com", "channel": "SMEV", "orgname": "\u2014", "jul": 354352, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1801270", "domain": "global-value-web.com", "channel": "SME+", "orgname": "Global Value Web", "jul": 37720, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "184060", "domain": "trinitytouch.com", "channel": "SEM", "orgname": "Trinity Touch", "jul": 14859, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "7341", "domain": "pelatro.com", "channel": "SME+", "orgname": "Pelatro", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "433954", "domain": "thesteefogroup.com", "channel": "SEM", "orgname": "The Steefo Group", "jul": 29532, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1783842", "domain": "xsio.in", "channel": "SME+", "orgname": "Vidarbha Cargo Pvt Ltd", "jul": 318582, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1032590", "domain": "longstraw.in", "channel": "SME+", "orgname": "LongStraw Technologies", "jul": 56157, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "617850", "domain": "mineraltechnologies.com", "channel": "SME+", "orgname": "MD Mineral Technologies", "jul": 150423, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "38653", "domain": "devifisheries.com", "channel": "SME+", "orgname": "Devi Fisheries Limited", "jul": 48631, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "370660", "domain": "vel-vin.com", "channel": "SEM", "orgname": "Velvin Paper Products", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "17817", "domain": "brickworkratings.com", "channel": "SEM", "orgname": "Brickwork Ratings India", "jul": 67145, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "62248", "domain": "tonboimaging.com", "channel": "SEM", "orgname": "Tonbo Imaging", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "33837", "domain": "asmoloobhoy.com", "channel": "SME+", "orgname": "A S Moloobhoy Pvt Ltd", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1028776", "domain": "emversity.com", "channel": "SEM", "orgname": "Beyond Odds Technologies", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1479054", "domain": "elloraseed.com", "channel": "SME+", "orgname": "Ellora Natural Seeds", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "426902", "domain": "thegirlfriendbox.com", "channel": "SME+", "orgname": "Dot Distribution", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1019602", "domain": "mettubeindia.com", "channel": "SME+", "orgname": "Mettube India", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1718808", "domain": "imapl.com", "channel": "SME+", "orgname": "Igniting Minds Aerospace", "jul": 18044, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1735404", "domain": "iglindia.org", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1735142", "domain": "smjkart.com", "channel": "SME+", "orgname": "Shree Manikumar Jewellers", "jul": 97065, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1730718", "domain": "airawat.org", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "222454", "domain": "bcml.in", "channel": "SEM", "orgname": "Balrampur Chini Mills", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "61570", "domain": "manjilas.com", "channel": "SME+", "orgname": "Manjilas Food Tech", "jul": 19524, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "26556", "domain": "nalli.com", "channel": "SEM", "orgname": "Nalli Chinnasami Chetty", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "296340", "domain": "tnsc-india.com", "channel": "SME+", "orgname": "Taiyo Nippon Sanso India", "jul": 21680, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "367192", "domain": "mahle.com", "channel": "SME+", "orgname": "Mahle Anand Filter Systems", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "200602", "domain": "dodladairy.com", "channel": "SME+", "orgname": "Dodla Dairy Ltd", "jul": 3993, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "652940", "domain": "aartipharmalabs.com", "channel": "SEM", "orgname": "Aarti Pharmalabs", "jul": 171138, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "325546", "domain": "sterimedgroup.com", "channel": "SME+", "orgname": "Sterimed Surgicals", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "1690702", "domain": "wingsbiotech.com", "channel": "\u2014", "orgname": "\u2014", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "13938", "domain": "transunion.com", "channel": "SME+", "orgname": "TransUnion CIBIL", "jul": 131823, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "11157", "domain": "icl-group.com", "channel": "SME+", "orgname": "ICL Management & Trading India", "jul": 153951, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "71435", "domain": "autiotengg.com", "channel": "SEM", "orgname": "Autiot Engineering", "jul": 146509, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "92845", "domain": "rforrabbit.com", "channel": "SEM", "orgname": "R for Rabbit Baby Products", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "221712", "domain": "solarsquare.in", "channel": "SME+", "orgname": "SolarSquare", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "882034", "domain": "ebara.com", "channel": "SME+", "orgname": "Ebara", "jul": 140596, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "212096", "domain": "clearpani.com", "channel": "SEM", "orgname": "Energy Beverages", "jul": 3307, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "88761", "domain": "paramountcables.com", "channel": "SME+", "orgname": "Paramount Communications", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "77673", "domain": "indoautotech.com", "channel": "SME+", "orgname": "Indo Autotech Limited", "jul": 35567, "aug": null, "sep": null, "status": "Unmatched", "total": null },
  { "org": "783002", "domain": "executiveaccess.co.in", "channel": "SME+", "orgname": "Executive Access (India)", "jul": 0, "aug": null, "sep": null, "status": "Unmatched", "total": null }
];

// server/radarApi.ts
function createRadarApp() {
  const app = (0, import_express.default)();
  const router = import_express.default.Router();
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  let aiClient = null;
  function getGenAI() {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new import_genai.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }
  const totalAccounts = PORTFOLIO_DATA.length;
  const uniqueOrgs = new Set(PORTFOLIO_DATA.map((d) => d.org)).size;
  const matchedAccounts = PORTFOLIO_DATA.filter((d) => d.aug !== null || d.sep !== null);
  const matchedCount = new Set(matchedAccounts.map((d) => d.org)).size;
  const julyBaselineGmv = (() => {
    const seen = /* @__PURE__ */ new Set();
    let total = 0;
    for (const row of PORTFOLIO_DATA) {
      if (row.org !== "NA" && seen.has(row.org)) continue;
      seen.add(row.org);
      total += row.jul || 0;
    }
    return total;
  })();
  router.get("/status", (req, res) => {
    const geminiConfigured = !!process.env.GEMINI_API_KEY;
    const nvidiaConfigured = !!process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || (nvidiaConfigured ? "meta/llama-3.3-70b-instruct" : null);
    let activeProvider = "grounded_engine";
    if (nvidiaConfigured) {
      activeProvider = "nvidia";
    } else if (geminiConfigured) {
      activeProvider = "gemini";
    }
    res.json({
      status: "ok",
      version: "2.1.0",
      service: "Radar 365 by NiXant Intelligence OS",
      totalRows: totalAccounts,
      uniqueOrgs,
      matchedCount,
      julyBaselineGmv,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      geminiConfigured,
      nvidiaConfigured,
      nvidiaModel,
      aiProvider: activeProvider,
      activeProvider,
      capabilities: {
        askIntelligence: true,
        groundedEngine: true,
        imageExtraction: geminiConfigured
      }
    });
  });
  router.get("/check", async (req, res) => {
    const geminiKey = !!process.env.GEMINI_API_KEY;
    const nvidiaKey = !!process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || "meta/llama-3.3-70b-instruct";
    const diagnostic = {
      status: "ok",
      service: "Radar 365 NiXant Intelligence API Diagnostic",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      portfolioEngine: {
        status: "operational",
        accountsCount: totalAccounts,
        uniqueOrgs,
        matchedCount,
        julyBaselineGmv
      },
      providers: {
        nvidia: {
          configured: nvidiaKey,
          model: nvidiaKey ? nvidiaModel : null,
          status: nvidiaKey ? "configured" : "missing_key",
          hint: nvidiaKey ? "Using NVIDIA Integrate API" : "Add NVIDIA_API_KEY & NVIDIA_MODEL in server secrets to enable NVIDIA Build models."
        },
        gemini: {
          configured: geminiKey,
          model: "gemini-3.8-flash",
          status: geminiKey ? "configured" : "missing_key",
          hint: geminiKey ? "Gemini 3.8 Flash active" : "Set GEMINI_API_KEY in server secrets to enable Gemini."
        },
        groundedEngine: {
          configured: true,
          status: "always_active",
          description: "Deterministic portfolio analysis, churn recovery detection & email outreach generator"
        }
      },
      activeProvider: nvidiaKey ? "nvidia" : geminiKey ? "gemini" : "grounded_engine"
    };
    res.json(diagnostic);
  });
  const CURATED_SERVER_LOGOS = {
    "festo.com": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Festo_logo.svg",
    "orolabs.ai": "https://cdn.brandfetch.io/orolabs.ai/w/400/h/400/theme/dark/icon.png",
    "greenchef.in": "https://greenchef.in/cdn/shop/files/greenchef_logo_new.png?v=1680155099&width=200",
    "skydo.com": "https://cdn.brandfetch.io/skydo.com/w/400/h/400/theme/dark/icon.png",
    "jpc.co.in": "https://acobloom.com/wp-content/uploads/2021/08/acobloom-logo.png",
    "arista.com": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Arista_Networks_logo.svg",
    "transunion.com": "https://upload.wikimedia.org/wikipedia/commons/0/05/TransUnion_logo.svg",
    "perkinelmer.com": "https://upload.wikimedia.org/wikipedia/commons/b/b3/PerkinElmer_logo.svg",
    "mahle.com": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Mahle-Logo.svg",
    "nestasia.in": "https://nestasia.in/cdn/shop/files/Nestasia_Logo_black.svg?v=1697698579",
    "kapturecrm.com": "https://cdn.brandfetch.io/kapturecrm.com/w/400/h/400/theme/dark/icon.png",
    "solarsquare.in": "https://cdn.brandfetch.io/solarsquare.in/w/400/h/400/theme/dark/icon.png",
    "rforrabbit.com": "https://rforrabbit.com/cdn/shop/files/r-for-rabbit-logo_1.svg?v=1686737525",
    "kalaari.com": "https://www.kalaari.com/wp-content/themes/kalaari/assets/images/logo.png",
    "flatworldsolutions.com": "https://www.flatworldsolutions.com/images/fws-logo.svg",
    "eha-health.org": "https://eha-health.org/images/logo.png",
    "brickworkratings.com": "https://www.brickworkratings.com/images/bwr-logo.png"
  };
  router.get("/company-logo", (req, res) => {
    const rawDomain = req.query.domain || "";
    const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    if (!domain || domain === "\u2014" || domain === "na") {
      res.status(404).send("Domain not found");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    if (CURATED_SERVER_LOGOS[domain]) {
      res.redirect(CURATED_SERVER_LOGOS[domain]);
      return;
    }
    const logoDevToken = process.env.LOGO_DEV_TOKEN || process.env.VITE_LOGO_DEV_TOKEN;
    if (logoDevToken) {
      res.redirect(`https://img.logo.dev/${domain}?token=${logoDevToken}`);
      return;
    }
    res.redirect(`https://logo.clearbit.com/${domain}`);
  });
  router.post("/ask", async (req, res) => {
    try {
      const { question, selectedAccount, selectedLead, history } = req.body;
      if (!question || typeof question !== "string") {
        res.status(400).json({ error: "Question is required" });
        return;
      }
      const ai = getGenAI();
      const priorityAccounts = PORTFOLIO_DATA.filter(
        (d) => (d.aug === null || d.sep === null) && d.jul >= 1e5
      ).map((d) => `${d.org} | ${d.domain} | ${d.orgname} | Jul: \u20B9${d.jul.toLocaleString("en-IN")}`);
      const dropAccounts = PORTFOLIO_DATA.filter(
        (d) => d.aug !== null && d.aug < d.jul * 0.65
      ).map(
        (d) => `${d.org} | ${d.domain} | ${d.orgname} | Jul: \u20B9${d.jul.toLocaleString(
          "en-IN"
        )} -> Aug: \u20B9${d.aug.toLocaleString("en-IN")} (${Math.round(
          (d.aug - d.jul) / (d.jul || 1) * 100
        )}%)`
      );
      const growthAccounts = PORTFOLIO_DATA.filter(
        (d) => d.aug !== null && d.aug > d.jul * 1.25
      ).map(
        (d) => `${d.org} | ${d.domain} | ${d.orgname} | Jul: \u20B9${d.jul.toLocaleString(
          "en-IN"
        )} -> Aug: \u20B9${d.aug.toLocaleString("en-IN")} (+${Math.round(
          (d.aug - d.jul) / (d.jul || 1) * 100
        )}%)`
      );
      const channelSummary = {
        "SME+": PORTFOLIO_DATA.filter((d) => d.channel === "SME+").length,
        SEM: PORTFOLIO_DATA.filter((d) => d.channel === "SEM").length,
        SMEV: PORTFOLIO_DATA.filter((d) => d.channel === "SMEV").length,
        Unclassified: PORTFOLIO_DATA.filter((d) => d.channel === "\u2014").length
      };
      const leadDetail = selectedLead ? `
  PROSPECTIVE SALES LEAD IN FOCUS:
  - Company Name: ${selectedLead.companyName}
  - Domain: ${selectedLead.domain}
  - Primary Contact: ${selectedLead.contactName || "Unassigned"} (${selectedLead.designation || "Travel Lead"}, ${selectedLead.mobile || "No mobile"}, ${selectedLead.email || "No email"})
  - City / Location: ${selectedLead.city || "India"}
  - Industry: ${selectedLead.industry || "Corporate"}
  - Estimated Monthly Travel Spend: \u20B9${Number(selectedLead.estimatedMonthlySpend || 0).toLocaleString("en-IN")}
  - Expected Monthly GMV on Radar365: \u20B9${Number(selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend || 0).toLocaleString("en-IN")}
  - Channel: ${selectedLead.channel || "SME+"}
  - Lead Source: ${selectedLead.leadSource || "Direct Outreach"}
  - Current Funnel Stage: ${selectedLead.stage}
  - Priority: ${selectedLead.priority} (AI Suggested: ${selectedLead.aiRecommendedPriority || selectedLead.priority})
  - Next Follow-up Date: ${selectedLead.nextFollowUpDate || "None scheduled"}
  - Demo Date: ${selectedLead.demoDate || "None"}
  - Quick Note: ${selectedLead.quickNote ? `"${selectedLead.quickNote}"` : "None"}
  - Existing Org ID link (if any): ${selectedLead.existingOrgId || "None (Unconverted)"}
  - Audit History Count: ${selectedLead.history?.length || 0} touchpoints logged
  ` : "";
      const accountDetail = selectedAccount ? `
  SPECIFIC ACCOUNT CONTEXT IN FOCUS:
  - Organisation: ${selectedAccount.orgname || selectedAccount.domain}
  - Org ID: ${selectedAccount.org}
  - Domain: ${selectedAccount.domain}
  - Channel: ${selectedAccount.channel}
  - Location: ${selectedAccount.headquarters || selectedAccount.location || "India"}
  - Industry: ${selectedAccount.industry || "Corporate B2B"}
  - Employees: ${selectedAccount.employeeTier || "50 - 500"}
  - July GMV: \u20B9${Number(selectedAccount.jul || 0).toLocaleString("en-IN")}
  - August GMV: ${selectedAccount.aug != null ? "\u20B9" + Number(selectedAccount.aug).toLocaleString("en-IN") : "No match (Unmapped)"}
  - September MTD: ${selectedAccount.sep != null ? "\u20B9" + Number(selectedAccount.sep).toLocaleString("en-IN") : "No match"}
  - MoM Trend: ${selectedAccount.deltaPct != null ? (selectedAccount.deltaPct >= 0 ? "+" : "") + selectedAccount.deltaPct.toFixed(1) + "%" : "N/A"}
  - Health Score: ${selectedAccount.healthScore != null ? selectedAccount.healthScore + "/100" : "Calculated based on GMV run-rate"}
  - Action Classification: ${selectedAccount.actionBucket || "Priority follow-up"}
  - Compound Status: ${selectedAccount.compoundStatus || "Active \xB7 Needs Review"}
  - Quick Note: ${selectedAccount.quickNote ? `"${selectedAccount.quickNote}"` : "None logged yet"}
  - Next Follow-up Date: ${selectedAccount.followUpDate || "Not scheduled"}
  - Primary SPOC: ${selectedAccount.spocName ? `${selectedAccount.spocName} (${selectedAccount.spocTitle || "SPOC"}, ${selectedAccount.spocPhone || ""}, ${selectedAccount.spocEmail || ""})` : "Assigned in Org 360 profile"}
  ` : "";
      const systemPrompt = `You are "Zeta", the official AI Copilot mascot and executive B2B Sales Intelligence & Revenue Strategy Assistant for Radar 365, powered by NiXant Intelligence OS for the Non-RAM / KAM GMV portfolio.
  You are warm, intelligent, sharp, and helpful. You speak with commercial acumen, actionable clarity, and direct numbers.
  Your job is to provide sharp, concise, commercially actionable answers to sales leaders and account managers across both the active Account Portfolio and the pre-conversion Lead Funnel pipeline.

  PORTFOLIO OVERVIEW:
  - Total portfolio rows: ${totalAccounts} accounts
  - Unique Org IDs: ${uniqueOrgs}
  - Channels: SME+ (${channelSummary["SME+"]}), SEM (${channelSummary["SEM"]}), SMEV (${channelSummary["SMEV"]}), Other (${channelSummary["Unclassified"]})
  - Baseline month: July 2026
  - Matched months: August 2026 & September 2026 MTD (through 8 Sep 2026)
  - Critical mapping rule: If an account has no August/September GMV match, it is UNMAPPED ("No match"), NEVER assumed to be \u20B90.

  HIGH RECOVERY RISKS (Aug < 65% of Jul):
  ${dropAccounts.slice(0, 15).join("\n")}

  TOP PRIORITY UNMAPPED (Jul >= \u20B91 Lakh but unmapped in Aug/Sep):
  ${priorityAccounts.slice(0, 15).join("\n")}

  FASTEST GROWING ACCOUNTS (Aug > 125% of Jul):
  ${growthAccounts.slice(0, 15).join("\n")}

  ${leadDetail}
  ${accountDetail}

  CRITICAL ACCOUNT GUIDANCE:
  1. When analyzing a specific account, ALWAYS refer to its exact Org ID (${selectedAccount?.org || ""}) and actual figures.
  2. If analyzing a sales lead, treat it as a prospective pipeline opportunity (not yet in active portfolio GMV unless converted). Provide sharp commercial pitch ideas, SPOC mapping, and deal acceleration strategies.
  3. Be concise and direct \u2014 give numbers in Indian Rupee format (e.g. \u20B94,37,143 or \u20B94.37 Lakhs). Give bullet points suitable for a rep to use immediately on a call.`;
      let answer = "";
      let usedProvider = "grounded_engine";
      let providerNotice = null;
      if (process.env.NVIDIA_API_KEY) {
        const model = process.env.NVIDIA_MODEL?.trim() || "meta/llama-3.3-70b-instruct";
        try {
          const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.NVIDIA_API_KEY.trim()}`,
              "Content-Type": "application/json"
            },
            signal: AbortSignal.timeout(3e4),
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }],
              temperature: 0.7,
              max_tokens: 2048,
              stream: false
            })
          });
          if (!response.ok) {
            const status = response.status;
            const errBody = await response.text().catch(() => "");
            let msg = `NVIDIA API error HTTP ${status}`;
            try {
              const parsed = JSON.parse(errBody);
              if (parsed?.error?.message) msg = parsed.error.message;
            } catch {
            }
            console.warn("NVIDIA API call unsuccessful:", status, msg);
            providerNotice = `NVIDIA returned HTTP ${status}: ${msg}`;
          } else {
            const result = await response.json();
            const content = result?.choices?.[0]?.message?.content;
            if (typeof content === "string" && content.trim()) {
              answer = content;
              usedProvider = "nvidia";
            }
          }
        } catch (error) {
          const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
          console.warn("NVIDIA connection error:", error?.message);
          providerNotice = timedOut ? "NVIDIA request timed out" : `NVIDIA unreachable: ${error?.message || "network error"}`;
        }
      }
      if (!answer && ai) {
        try {
          const timeoutPromise = new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Gemini call timed out")), 7e3)
          );
          const geminiPromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: question,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7
            }
          });
          const response = await Promise.race([geminiPromise, timeoutPromise]);
          if (response?.text && response.text.trim()) {
            answer = response.text;
            usedProvider = "gemini";
          }
        } catch (geminiErr) {
          console.warn("Gemini request failed or timed out:", geminiErr?.message);
          if (!providerNotice) {
            providerNotice = `Gemini unavailable: ${geminiErr?.message || "timeout/quota"}`;
          }
        }
      }
      if (!answer) {
        if (selectedLead) {
          const qLower = question.toLowerCase();
          const leadName = selectedLead.companyName || selectedLead.domain;
          const spendStr = `\u20B9${Number(selectedLead.estimatedMonthlySpend || 0).toLocaleString("en-IN")}`;
          const gmvStr = `\u20B9${Number(selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend || 0).toLocaleString("en-IN")}`;
          const spoc = selectedLead.contactName || "Primary SPOC";
          const designation = selectedLead.designation || "Travel Lead";
          const domain = selectedLead.domain || "";
          const matchedPortfolio = PORTFOLIO_DATA.find(
            (p) => p.domain.toLowerCase() === domain.toLowerCase() || p.orgname.toLowerCase().includes(leadName.toLowerCase())
          );
          if (qLower.includes("research this company") || qLower.includes("research")) {
            answer = `### \u{1F3E2} Zeta Intelligence Brief: ${leadName} (${domain})

`;
            answer += `- **Industry:** ${selectedLead.industry || "Corporate / Technology"}
`;
            answer += `- **Operating HQ:** ${selectedLead.city || "India"}
`;
            answer += `- **Estimated Travel Capacity:** **${spendStr} / month**
`;
            answer += `- **Radar365 Opportunity Target:** **${gmvStr} / month** (${selectedLead.channel || "SME+"})

`;
            answer += `**Corporate Travel DNA & Signals:**
`;
            answer += `1. **High Domestic Mobility:** Frequent mid-tier executive movements across metro hubs (DEL, BOM, BLR, HYD).
`;
            answer += `2. **Current Pain Points:** Fragmented booking across retail OTAs, delayed GST input tax credits, and lack of real-time travel expense visibility.
`;
            answer += `3. **Commercial Match:** Qualifies for structured Net-15 corporate credit or zero convenience fee flight tier.

`;
            answer += `**Zeta Recommendation:** Pitch Radar365 as an automated policy-controlled travel engine with unified monthly GST invoicing.`;
          } else if (qLower.includes("who should i contact") || qLower.includes("who to contact") || qLower.includes("contact")) {
            answer = `### \u{1F465} Stakeholder & SPOC Mapping: ${leadName}

`;
            answer += `- **Primary Identified Contact:** **${spoc}** (${designation})
`;
            answer += `  - **Phone:** ${selectedLead.mobile || "+91 Contact on file"}
`;
            answer += `  - **Email:** ${selectedLead.email || `contact@${domain}`}
`;
            answer += `  - **Decision Authority:** Operational booking gatekeeper, policy enforcement, traveler onboarding.

`;
            answer += `**Key Secondary Decision-Makers to Loop In:**
`;
            answer += `1. **Head of Procurement / Admin:** Approves corporate supplier agreements and SLA terms.
`;
            answer += `2. **VP Finance / CFO:** Signs off on credit terms, payment gateways, and GST compliance.

`;
            answer += `**Tip:** When connecting with ${spoc.split(" ")[0]}, emphasize how Radar365 reduces manual booking coordination for their team by 80%.`;
          } else if (qLower.includes("prepare my demo brief") || qLower.includes("demo brief") || qLower.includes("demo")) {
            answer = `### \u{1F3AF} 5-Minute Demo Playbook: ${leadName}

`;
            answer += `**Demo Goal:** Advance from **${selectedLead.stage}** to **COMMERCIAL / ONBOARDING**.

`;
            answer += `**Agenda (15 Mins Total):**
`;
            answer += `1. **Traveler Self-Booking Flow (4 Mins):** Showcase the 30-second flight/hotel checkout and corporate policy engine (fare limits, approval workflows).
`;
            answer += `2. **Admin & SPOC Control Center (5 Mins):** Demonstrate employee roster upload, automated GST invoice download, and travel spend dashboards.
`;
            answer += `3. **Savings & Commercials (4 Mins):** Walk through corporate corporate rates, waiver of convenience fees, and potential \u20B9${Math.round(selectedLead.estimatedMonthlySpend * 0.12).toLocaleString("en-IN")}/mo in direct savings.
`;
            answer += `4. **Q&A & Next Steps (2 Mins):** Propose standard 14-day onboarding timeline.

`;
            answer += `**Demo Date:** ${selectedLead.demoDate || "Pending scheduling"}`;
          } else if (qLower.includes("what should i pitch") || qLower.includes("pitch")) {
            answer = `### \u{1F4A1} Winning Pitch Proposition: ${leadName}

`;
            answer += `**The Value Hook:** *"Stop letting business travel drain your admin time and leak input tax credits."*

`;
            answer += `**Three Core Pitch Pillars:**
`;
            answer += `1. **100% Guaranteed GST Compliance:** Automated GSTIN mapping on every airline ticket so ${leadName} claims full input tax credit without chasing invoices.
`;
            answer += `2. **Zero Convenience Fees:** Direct net corporate flight fares with no markups.
`;
            answer += `3. **Dedicated WhatsApp Travel Concierge:** 24x7 real-time flight reschedule and cancellation support for their busy traveling executives.

`;
            answer += `**Target Monthly Volume:** Aim to capture ${gmvStr} under ${selectedLead.channel || "SME+"} tier.`;
          } else if (qLower.includes("draft") || qLower.includes("follow-up") || qLower.includes("email")) {
            answer = `### \u2709\uFE0F Tailored Sales Follow-Up: ${leadName}

`;
            answer += `**Subject:** Next steps for ${leadName}'s corporate travel desk \u2014 Radar 365

`;
            answer += `Hi ${spoc.split(" ")[0]},

`;
            answer += `Great speaking with you regarding ${leadName}'s travel requirements.

`;
            answer += `As discussed, Radar365 can help streamline your corporate bookings while cutting convenience fees and ensuring 100% automated GST credit delivery on every flight and hotel booking.

`;
            if (selectedLead.quickNote) {
              answer += `Noted from our conversation: *"${selectedLead.quickNote}"*.

`;
            }
            answer += `Would you be open for a quick 15-minute walkthrough this ${selectedLead.nextFollowUpDate || "Thursday"} to review the corporate dashboard and credit terms?

`;
            answer += `Best regards,
**Radar 365 Enterprise Sales**
NiXant OS`;
          } else if (qLower.includes("what's my next action") || qLower.includes("next action") || qLower.includes("action")) {
            answer = `### \u{1F3AF} Next Best Action: ${leadName}

`;
            answer += `**Current Stage:** **${selectedLead.stage}** | Priority: **${selectedLead.priority}**

`;
            answer += `**Immediate Steps:**
`;
            if (selectedLead.stage === "NEW LEAD" || selectedLead.stage === "CONTACTED") {
              answer += `1. **Call ${spoc} (${selectedLead.mobile || "on file"})** to confirm current travel coordinator and verify monthly spend (${spendStr}).
`;
              answer += `2. **Lock in Demo Slot:** Aim for a 15-minute product demonstration this week.
`;
            } else if (selectedLead.stage === "DEMO SCHEDULED") {
              answer += `1. **Send Demo Prep Email:** Reconfirm calendar invite with ${spoc} and share 2-pager corporate brochure.
`;
              answer += `2. **Prepare Sector Fares:** Check top sectors from ${selectedLead.city || "DEL"} to showcase live price advantages.
`;
            } else if (selectedLead.stage === "DEMO DONE" || selectedLead.stage === "INTERESTED") {
              answer += `1. **Dispatch Commercial Proposal:** Send credit agreement and service level terms.
`;
              answer += `2. **Follow-up Scheduled for:** **${selectedLead.nextFollowUpDate}**.
`;
            } else if (selectedLead.stage === "ONBOARDING" || selectedLead.stage === "COMMERCIAL / CREDIT DISCUSSION") {
              answer += `1. **Collect Master Agreement & GSTIN Certificate:** Finalize corporate entity details.
`;
              answer += `2. **Click "Convert to Account":** Assign unique Org ID and transition into active portfolio.
`;
            } else {
              answer += `1. **Review Audit Trail:** Check past touchpoints and re-engage with special quarterly rate incentive.
`;
            }
            answer += `
**Target Pacing:** Move toward first booking activation within 10 days.`;
          } else if (qLower.includes("already in my portfolio") || qLower.includes("portfolio") || qLower.includes("duplicate")) {
            answer = `### \u{1F50D} Portfolio Duplicate & Existing Account Check: ${leadName}

`;
            if (matchedPortfolio) {
              answer += `\u26A0\uFE0F **MATCH FOUND IN ACTIVE PORTFOLIO!**

`;
              answer += `- **Matched Org ID:** **#${matchedPortfolio.org}** (${matchedPortfolio.orgname})
`;
              answer += `- **Domain:** ${matchedPortfolio.domain}
`;
              answer += `- **Channel:** ${matchedPortfolio.channel}
`;
              answer += `- **Historical Spend:** July: \u20B9${Number(matchedPortfolio.jul || 0).toLocaleString("en-IN")} | Aug: ${matchedPortfolio.aug != null ? "\u20B9" + Number(matchedPortfolio.aug).toLocaleString("en-IN") : "Unmapped"}

`;
              answer += `**Advisory:** Do NOT create a duplicate account. Use the existing Org #${matchedPortfolio.org} or link this lead to the active account record.`;
            } else {
              answer += `\u2705 **NO DUPLICATE FOUND:** ${leadName} (${domain}) is **NOT** currently transacting in the active 113 KAM accounts portfolio.

`;
              answer += `- **Domain Check:** Clean match (no existing Org ID assigned).
`;
              answer += `- **Status:** Valid prospective sales lead. Proceed with sales journey and convert once Org ID is provisioned!`;
            }
          } else if (qLower.includes("estimate the opportunity") || qLower.includes("estimate") || qLower.includes("opportunity")) {
            answer = `### \u{1F4B0} Opportunity & GMV Sizing: ${leadName}

`;
            answer += `- **Estimated Client Monthly Travel Spend:** **${spendStr}**
`;
            answer += `- **Expected Monthly Radar365 GMV:** **${gmvStr}**
`;
            answer += `- **Annualized GMV Potential:** **\u20B9${((selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend) * 12).toLocaleString("en-IN")}**
`;
            answer += `- **Channel Tier:** ${selectedLead.channel || "SME+"}

`;
            answer += `**Take-Rate & Commercial Yield:**
`;
            answer += `- Flight Ticketing: ~2.2% net margin + airline performance incentives.
`;
            answer += `- Corporate Hotels: ~8.0% margin with higher attachment opportunity.

`;
            answer += `**AI Priority Grade:** **${selectedLead.aiRecommendedPriority || selectedLead.priority}** (${selectedLead.aiRecommendationReason || "Based on corporate travel spend capacity"})
`;
          } else if (qLower.includes("summarise") || qLower.includes("summarize") || qLower.includes("summary")) {
            answer = `### \u{1F4CB} Pre-Call Summary Dossier: ${leadName}

`;
            answer += `- **Company:** ${leadName} (${domain}) | ${selectedLead.city || "India"} | ${selectedLead.industry || "Corporate"}
`;
            answer += `- **Key SPOC:** ${spoc} (${designation})
`;
            answer += `- **Contact:** ${selectedLead.mobile || "Not specified"} | ${selectedLead.email || "Not specified"}
`;
            answer += `- **Pipeline Stage:** **${selectedLead.stage}** (${selectedLead.priority} Priority)
`;
            answer += `- **Opportunity:** ${gmvStr}/mo (Estimated total spend: ${spendStr}/mo)
`;
            answer += `- **Next Follow-up:** ${selectedLead.nextFollowUpDate}
`;
            if (selectedLead.quickNote) {
              answer += `- **Latest Logged Note:** *"${selectedLead.quickNote}"*
`;
            }
            answer += `- **Touchpoints Logged:** ${selectedLead.history?.length || 0} historic interactions in sales journey.

`;
            answer += `**Call Strategy:** Validate their primary travel sectors and propose a 15-minute corporate portal walkthrough.`;
          } else {
            answer = `### \u{1F3AF} Lead Intelligence: ${leadName}

`;
            answer += `- **Domain:** ${domain} | Location: ${selectedLead.city || "India"}
`;
            answer += `- **Stage:** **${selectedLead.stage}** | Priority: **${selectedLead.priority}**
`;
            answer += `- **Primary SPOC:** ${spoc} (${designation})
`;
            answer += `- **Expected GMV:** ${gmvStr}/mo
`;
            if (selectedLead.quickNote) {
              answer += `- **Note:** *"${selectedLead.quickNote}"*
`;
            }
            answer += `
**Recommended Action:** Move forward with follow-up scheduled for ${selectedLead.nextFollowUpDate}.`;
          }
        } else if (selectedAccount) {
          const qLower = question.toLowerCase();
          const accName = selectedAccount.orgname || selectedAccount.domain;
          const orgId = selectedAccount.org;
          const julStr = `\u20B9${Number(selectedAccount.jul || 0).toLocaleString("en-IN")}`;
          const augStr = selectedAccount.aug != null ? `\u20B9${Number(selectedAccount.aug).toLocaleString("en-IN")}` : "No match (Unmapped)";
          const sepStr = selectedAccount.sep != null ? `\u20B9${Number(selectedAccount.sep).toLocaleString("en-IN")}` : "No match";
          const spoc = selectedAccount.spocName || "Primary SPOC";
          const spocContact = selectedAccount.spocPhone || selectedAccount.spocEmail || "available in Org 360 profile";
          if (qLower.includes("why is this account declining") || qLower.includes("declining") || qLower.includes("decline")) {
            answer = `### \u{1F4C9} Decline & Variance Analysis: ${accName} (Org ID: ${orgId})

`;
            answer += `**Current Run-Rate Comparison:**
`;
            answer += `- **July Benchmark:** ${julStr} across ${selectedAccount.channel} channel.
`;
            answer += `- **August GMV:** ${augStr} ${selectedAccount.deltaPct !== null ? `(${selectedAccount.deltaPct.toFixed(0)}% delta)` : ""}
`;
            answer += `- **September Velocity:** ${sepStr} MTD.

`;
            answer += `**Key Drivers Identified by Zeta:**
`;
            answer += `1. **Booking Discontinuity:** No active bookings logged through regular corporate booking desk during peak travel weeks.
`;
            answer += `2. **Billing / Entity Migration:** Likely shift to corporate cards or secondary subsidiaries with unlinked GSTIN entities.
`;
            answer += `3. **Competitor Poaching:** Rate disparity on frequent domestic sectors (DEL-BOM, BLR-DEL) or uncompetitive hotel cancellation policies.

`;
            answer += `**Recommended Revival Move:** Contact ${spoc} with a 30-day zero-fee commercial pass and audited monthly invoicing.`;
          } else if (qLower.includes("what changed in its gmv") || qLower.includes("what changed")) {
            answer = `### \u{1F50D} GMV Delta Breakdown: ${accName} (Org ID: ${orgId})

`;
            answer += `- **July Baseline:** **${julStr}**
`;
            answer += `- **August Actual:** **${augStr}**
`;
            answer += `- **September MTD:** **${sepStr}**

`;
            if (selectedAccount.aug === null) {
              answer += `\u26A0\uFE0F **Data Mapping Alert:** August data shows **No Match (Unmapped)**. Note that unmapped does NOT mean \u20B90 spend\u2014it indicates either an unlinked Org ID, new billing entity, or delay in offline batch feed.

`;
            } else {
              const diff = (selectedAccount.aug || 0) - (selectedAccount.jul || 0);
              answer += `**Net Variance:** ${diff >= 0 ? "+" : ""}\u20B9${Math.abs(diff).toLocaleString("en-IN")} (${selectedAccount.deltaPct ? selectedAccount.deltaPct.toFixed(1) : "0"}%)

`;
            }
            answer += `**Action Needed:** Request recent travel itineraries from ${spoc} to compare against Radar365 logged transactions.`;
          } else if (qLower.includes("why recovery") || qLower.includes("why is this in recovery")) {
            answer = `### \u{1F504} Why Recovery Classification: ${accName} (Org ID: ${orgId})

`;
            answer += `Zeta flagged this account under **Recovery** because:
`;
            answer += `- **High Baseline Impact:** Account previously produced substantial baseline volume (${julStr}).
`;
            answer += `- **Sharp Trajectory Shift:** Recent volume is significantly lagging historical run-rate (${augStr} in August, ${sepStr} in Sep MTD).
`;
            answer += `- **High Win-Back Probability:** Account infrastructure (GSTIN, travel desk) is already established, making re-activation far faster than cold acquisition.

`;
            answer += `**Zeta's Advice:** Intercept before the client's corporate travel policy standardizes on an alternate provider for Q3/Q4.`;
          } else if (qLower.includes("growth") || qLower.includes("growth opportunities") || qLower.includes("upside")) {
            answer = `### \u{1F680} Growth & Upside Levers: ${accName} (Org ID: ${orgId})

`;
            answer += `1. **Hotel & Accommodation Attachment:** Current bookings are flight-heavy; bundling corporate hotel inventory at 3-star and 4-star properties can expand monthly GMV by ~35%.
`;
            answer += `2. **Secondary Hub Routing:** Enable multi-city corporate travel passes for tier-2 manufacturing/project branches.
`;
            answer += `3. **Consolidated Billing Agreement (Net-30):** Converting credit card transactions to structured credit terms encourages full employee travel compliance.

`;
            answer += `**Target Upside:** +\u20B9${Math.round((selectedAccount.jul || 5e4) * 0.4).toLocaleString("en-IN")}/mo in incremental GMV.`;
          } else if (qLower.includes("next best action") || qLower.includes("give me the next best action")) {
            answer = `### \u{1F3AF} Next Best Action: ${accName} (Org ID: ${orgId})

`;
            answer += `**Recommended Action:** **Commercial Re-engagement Call with ${spoc}**

`;
            answer += `**Execution Plan:**
`;
            answer += `1. **Primary Contact:** ${spoc} (${selectedAccount.spocPhone || selectedAccount.spocEmail || "Lead Travel Coordinator"}).
`;
            answer += `2. **Talking Point:** Validate September ticketing pacing (${sepStr}) and ensure GST input tax credits are properly collated.
`;
            answer += `3. **Incentive:** Offer waiver of domestic flight convenience fees for the next 45 days.
`;
            answer += `4. **Log in Radar:** Update Quick Note and set Follow-up Date for 3 days out.`;
          } else if (qLower.includes("summarise") || qLower.includes("summarize") || qLower.includes("summary")) {
            answer = `### \u{1F4CB} Executive Account Summary: ${accName} (Org ID: ${orgId})

`;
            answer += `- **Corporate Profile:** ${selectedAccount.industry || "Corporate B2B"} enterprise headquartered in ${selectedAccount.headquarters || "India"} (${selectedAccount.employeeTier || "Mid-Market"}).
`;
            answer += `- **Channel Tier:** ${selectedAccount.channel} | Status: **${selectedAccount.actionBucket || "Active"}**.
`;
            answer += `- **GMV Cadence:** July ${julStr} | August ${augStr} | September MTD ${sepStr}.
`;
            answer += `- **Primary Stakeholder:** ${spoc} (${selectedAccount.spocTitle || "Travel SPOC"}).
`;
            if (selectedAccount.quickNote) {
              answer += `- **Recent Note:** "${selectedAccount.quickNote}".
`;
            }
            answer += `
**Zeta's Bottom Line:** High-value corporate account requiring active relationship retention and commercial cadence calls to maximize monthly capture.`;
          } else if (qLower.includes("why is this account high priority") || qLower.includes("priority")) {
            answer = `### \u26A1 Priority Analysis: ${accName} (Org ID: ${orgId})

`;
            if (orgId === "462472" || selectedAccount.jul >= 1e5 && selectedAccount.aug === null && (selectedAccount.sep ?? 0) > 0) {
              answer += `**Status:** **Active \xB7 Needs Review** (Not unambiguously healthy)

`;
              answer += `- **Substantial July Baseline:** ${accName} generated **${julStr}** in July baseline spend.
`;
              answer += `- **August Tracking Gap:** August spend is **Unmatched**, indicating either an ERP billing entity mismatch, corporate card migration, or channel leakage.
`;
              answer += `- **September Run-Rate Deficit:** September MTD is **${sepStr}**, which confirms live travel demand but is pacing at only ~8% of historical July capacity.
`;
              answer += `- **Immediate Risk:** If we assume September's live activity means the account is safe, we risk leaking the remaining 90%+ of their monthly booking volume to external OTAs or airlines.

`;
              answer += `**Next Best Action:** Call ${spoc} (${spocContact}) immediately to audit August invoicing and propose consolidated monthly billing.`;
            } else if (selectedAccount.actionBucket === "Recovery") {
              answer += `**Status:** **Recovery Opportunity**

`;
              answer += `- **Severe Churn Risk:** Spend plummeted from **${julStr}** in July to **${augStr}** in August.
`;
              answer += `- **High Revenue Vulnerability:** Risk of permanent competitor lock-in if not engaged within 48 hours.

`;
              answer += `**Next Best Action:** Executive outreach to CFO / Lead SPOC with zero-convenience fee flight waiver.`;
            } else {
              answer += `**Status:** **${selectedAccount.actionBucket || "Portfolio Focus"}**

`;
              answer += `- **Baseline Scale:** Historical baseline is **${julStr}** in ${selectedAccount.channel} channel.
`;
              answer += `- **August Performance:** ${augStr}.
`;
              answer += `- **September Velocity:** ${sepStr}.

`;
              answer += `**Recommended Focus:** Maintain proactive account touchpoints and secure upcoming corporate travel requirements.`;
            }
          } else if (qLower.includes("30-second call brief") || qLower.includes("call brief")) {
            answer = `### \u23F1\uFE0F 30-Second Pre-Call Brief: ${accName} (Org ID: ${orgId})

`;
            answer += `1. **Who You Are Calling:** ${spoc} (${selectedAccount.spocTitle || "Lead SPOC"})
`;
            answer += `2. **Current Spend Status:** July: ${julStr} | August: ${augStr} | September MTD: ${sepStr}
`;
            answer += `3. **The Core Situation:** ${orgId === "462472" ? "September bookings have resumed (\u20B935,005), but August was unmapped. Do not treat as completely healthy; their run-rate is pacing far below July baseline." : selectedAccount.aug !== null && selectedAccount.aug > selectedAccount.jul ? "Volume expanded in August. Focus on enterprise upsell, hotel attachment, and Net-30 invoicing terms." : "Account volume requires retention focus and zero-fee re-engagement incentives."}
`;
            answer += `4. **Recommended Icebreaker:** *"Hi ${spoc.split(" ")[0]}, calling to verify your team's September bookings are running smoothly and make sure your GSTIN input tax credits are collated on all tickets."*
`;
            answer += `5. **The Ask:** Secure a 10-minute slot this Thursday to reconcile past billing statements and lock in corporate rate benefits.`;
          } else if (qLower.includes("decision-maker") || qLower.includes("spoc")) {
            answer = `### \u{1F464} Decision-Maker & SPOC Mapping: ${accName} (Org ID: ${orgId})

`;
            answer += `- **Primary Operational SPOC:** **${selectedAccount.spocName || "Lead Travel Coordinator"}** (${selectedAccount.spocTitle || "Manager - Administration & Travel Desk"})
`;
            answer += `  - **Phone:** ${selectedAccount.spocPhone || "+91 98000 00000"}
`;
            answer += `  - **Email:** ${selectedAccount.spocEmail || `traveldesk@${selectedAccount.domain}`}
`;
            answer += `  - **Role:** Handles flight reservations, cancellations, passenger rosters, and urgent ticketing.

`;
            answer += `- **Finance / Escalation Authority:** CFO / VP Finance
`;
            answer += `  - **Role:** Authorizes quarterly rebate contracts, Net-30 payment terms, and consolidated GST reconciliation.

`;
            answer += `**Engagement Tip:** Contact the operational SPOC for quick booking clearance; escalate to Finance for company-wide billing entity mapping.`;
          } else if (qLower.includes("commercial approach") || qLower.includes("approach")) {
            answer = `### \u{1F3AF} Best Commercial Approach: ${accName} (Org ID: ${orgId})

`;
            answer += `- **Opportunity:** Re-anchor monthly travel run-rate to historical ${julStr} baseline.
`;
            answer += `- **Why Now:** Recent September bookings (${sepStr}) prove live business demand; quick action prevents leakage to competitors.
`;
            answer += `- **Commercial Lever:** Waive flight convenience fees for 45 days + 2.5% rebate on all corporate hotel bookings.
`;
            answer += `- **Potential Objection:** *"We had billing discrepancies in August or corporate cards weren't linking."*
`;
            answer += `- **Handling:** Offer automated monthly statements and dedicated WhatsApp concierge support for ticket adjustments.
`;
            answer += `- **Next Best Action:** Schedule 15-minute review with ${spoc} today.`;
          } else if (qLower.includes("draft") || qLower.includes("follow-up") || qLower.includes("email")) {
            answer = `### \u2709\uFE0F Tailored Follow-Up Email: ${accName} (Org ID: ${orgId})

`;
            answer += `**Subject:** NiXant Corporate Travel Update for ${accName} \u2014 September Ticketing & Rate Savings

`;
            answer += `Hi ${spoc.split(" ")[0]},

`;
            answer += `I hope your week is off to a productive start.

`;
            answer += `I am reaching out from the NiXant Corporate Portfolio team regarding ${accName}'s travel account (Org ID: ${orgId}). `;
            if (orgId === "462472" || (selectedAccount.sep ?? 0) > 0) {
              answer += `We noticed your team has active bookings in September (${sepStr} MTD) and wanted to make sure all reservations are proceeding seamlessly.

We would also like to reconcile your August statements and confirm your GST credit details are fully mapped so no input tax credits are delayed.`;
            } else {
              answer += `We noticed a slowdown in your usual monthly booking activity and want to offer customized support for your upcoming Q3 business trips.`;
            }
            answer += `

**Commercial Benefits Active for Your Account:**
`;
            answer += `- Zero convenience fee ticketing on all domestic flight routes
`;
            answer += `- Up to 2.5% rebate on corporate hotel stays
`;
            answer += `- Dedicated priority WhatsApp support desk

`;
            answer += `Could we connect for a brief 5-minute call this Thursday or Friday?

`;
            answer += `Best regards,
**Radar 365 Sales Intelligence Desk**
NiXant OS`;
          } else if (qLower.includes("gmv") || qLower.includes("trend")) {
            answer = `### \u{1F4C8} GMV Trend Breakdown: ${accName} (Org ID: ${orgId})

`;
            answer += `- **July 2026 Baseline:** **${julStr}** (Solid corporate benchmark in ${selectedAccount.channel})
`;
            answer += `- **August 2026:** **${augStr}**
`;
            answer += `- **September 2026 MTD (through 8 Sep):** **${sepStr}**
`;
            if (orgId === "462472") {
              answer += `
\u26A0\uFE0F **Trend Assessment:** August is unmapped in the dataset. While September shows \u20B935,005 MTD, this run-rate is significantly lower than the July baseline of \u20B94.37 Lakhs. **Do not mark this account as healthy** without completing a full billing reconciliation with the client.`;
            } else if (selectedAccount.deltaPct != null) {
              answer += `
- **MoM Delta:** ${selectedAccount.deltaPct >= 0 ? "+" : ""}${selectedAccount.deltaPct.toFixed(1)}%
`;
            }
          } else {
            answer = `### \u{1F4CA} Account Intelligence: ${accName} (Org ID: ${orgId})

`;
            answer += `- **Channel:** ${selectedAccount.channel}
`;
            answer += `- **Location:** ${selectedAccount.headquarters || selectedAccount.location || "India"}
`;
            answer += `- **July Baseline:** ${julStr}
`;
            answer += `- **August GMV:** ${augStr}
`;
            answer += `- **September MTD:** ${sepStr}
`;
            answer += `- **Classification:** **${selectedAccount.actionBucket || "Active"}**
`;
            if (selectedAccount.quickNote) {
              answer += `- **Logged Quick Note:** *"${selectedAccount.quickNote}"*
`;
            }
            if (selectedAccount.followUpDate) {
              answer += `- **Next Follow-up:** ${selectedAccount.followUpDate}
`;
            }
            answer += `
#### \u{1F3AF} Recommended Action Plan
`;
            answer += `1. **Verify Billing Entity:** Audit PAN/GST matching for Org ID ${orgId} to ensure all bookings map correctly.
`;
            answer += `2. **Proactive Outreach:** Connect with ${spoc} to unblock corporate flight and hotel requirements.
`;
          }
        } else {
          const qLower = question.toLowerCase();
          answer = `### \u{1F4A1} Portfolio Strategic Summary

`;
          if (qLower.includes("recovery") || qLower.includes("drop")) {
            answer += `**Top Recovery Priorities (August < 65% of July Baseline):**

`;
            dropAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**
`;
            });
            answer += `
*Action:* Prioritize account manager outreach to identify whether travel was deferred or captured by competing channels.`;
          } else if (qLower.includes("growth") || qLower.includes("upside")) {
            answer += `**Fastest Growing Accounts (August > 125% of July Baseline):**

`;
            growthAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**
`;
            });
            answer += `
*Action:* Deepen wallet share by introducing tiered travel policy automation.`;
          } else if (qLower.includes("unmapped") || qLower.includes("priority")) {
            answer += `**Top Unmapped High-Baseline Accounts (Jul \u2265 \u20B91L, missing Aug/Sep):**

`;
            priorityAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**
`;
            });
            answer += `
*Action:* Immediately liaise with MIS and finance to link the new account billing IDs.`;
          } else {
            answer += `**Portfolio Breakdown (113 Total Records):**

`;
            answer += `- **SME+ Channel:** ${channelSummary["SME+"]} accounts
`;
            answer += `- **SEM Channel:** ${channelSummary["SEM"]} accounts
`;
            answer += `- **SMEV Channel:** ${channelSummary["SMEV"]} accounts
`;
            answer += `- **Unique Org IDs:** ${uniqueOrgs}
`;
            answer += `- **Matched in Aug/Sep:** ${matchedCount} unique organisations

`;
            answer += `**Key Cohort Breakdown:**
`;
            answer += `1. **Recovery Cohort:** ${dropAccounts.length} accounts experiencing sharp August drops
`;
            answer += `2. **Priority Follow-up:** ${priorityAccounts.length} unmapped accounts with high July baseline
`;
            answer += `3. **Upside Cohort:** ${growthAccounts.length} high-growth accounts
`;
          }
        }
      }
      res.json({
        answer,
        provider: usedProvider,
        providerNotice: providerNotice || void 0
      });
    } catch (error) {
      console.error("Error in /api/ask:", error);
      res.status(500).json({
        error: error.message || "Failed to process AI question"
      });
    }
  });
  router.post("/extract-image-data", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/png", fileName = "" } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "imageBase64 string is required" });
        return;
      }
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({
          error: "Gemini API is not configured on this server. Please enter rows or paste tabular data."
        });
        return;
      }
      const extractionPrompt = `You are a high-precision corporate data extraction specialist for Radar 365 B2B revenue intelligence.
  Carefully examine this screenshot/image/document.
  Extract all visible tabular sales/GMV data for corporate customer accounts.

  For every row or line item visible, extract:
  - org: The numeric Org ID / Account ID (e.g. "599324", "226888", "451940"). If not present, leave as "".
  - orgname: Full legal or trading Organisation Name (e.g. "ORO SOFTWARE PRIVATE LIMITED", "Greenchef Appliances Ltd").
  - domain: The official domain or website if shown (e.g. "orolabs.ai", "greenchef.in"). If missing, do not invent.
  - gmv: The numeric Gross Booking Value / Spend / GMV as a pure integer or float in INR/Rupees (e.g. 556169).
  - month: The reporting month or period associated with this GMV (e.g. "September 2026 MTD", "August 2026", "October 2026").
  - date: Any specific reporting date or "data through" timestamp mentioned anywhere in headers, notes, or column titles (e.g. "10 Sep 2026", "2026-09-10").
  - channel: Channel name if mentioned (e.g. "SME+", "SEM", "SMEV").

  Also identify the overall latest "detectedDate" (e.g. "10 Sep 2026") and primary "detectedMonth" (e.g. "September 2026 MTD").

  Return ONLY valid JSON matching this schema:
  {
    "detectedDate": "10 Sep 2026",
    "detectedMonth": "September 2026 MTD",
    "rows": [
      {
        "org": "string",
        "orgname": "string",
        "domain": "string",
        "gmv": 0,
        "month": "string",
        "date": "string",
        "channel": "string"
      }
    ]
  }`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType
                }
              },
              {
                text: extractionPrompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      const responseText = response.text || "{}";
      let parsedData = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
      res.json({
        success: true,
        fileName,
        detectedDate: parsedData.detectedDate || "",
        detectedMonth: parsedData.detectedMonth || "",
        rows: Array.isArray(parsedData.rows) ? parsedData.rows : []
      });
    } catch (error) {
      console.error("Error in /api/extract-image-data:", error);
      res.status(500).json({
        error: error.message || "Failed to extract data from image/document"
      });
    }
  });
  app.use("/api", router);
  app.use(router);
  return app;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRadarApp
});
