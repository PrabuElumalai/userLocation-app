const userDetails = {
    name: 'Prabu Elumalai',
    email:'sridevprabu@outlook.com',
    linkedIn: 'https://www.linkedin.com/in/prabu-elumalai/',
    git:'https://github.com/PrabuElumalai'
}

const dummyApi = {
    baseUrl:'https://dummyapi.io/data/v1/user',
    header:{ "app-id": "6133558887895dca3fdc9a03","Content-Type": "application/javascript; charset=utf-8" },
    defaultPage:0,
    defaultLimit:10,
    currentPage:0
}

const geoNames = {
    baseUrl :'http://api.geonames.org/searchJSON',
    userName: 'prabuelumalai20'
}

var countryMap = new Map();
countryMap.set("Denmark",{lang:"da"});
countryMap.set("Netherlands",{lang:"nl"});
countryMap.set("Brazil",{lang:"pt-br"});
countryMap.set("Spain",{lang:"es"});
countryMap.set("Germany",{lang:"de"});
countryMap.set("Turkey",{lang:"tr"});
countryMap.set("Ireland",{lang:"ga"});
countryMap.set("United Kingdom",{lang:"en"});
countryMap.set("Finland",{lang:"fi"});
countryMap.set("Norway",{lang:"nn"});
countryMap.set("France",{lang:"fr"});
countryMap.set("Australia",{lang:"en"});
countryMap.set("Iran",{lang:"fa"});
countryMap.set("United States",{lang:"en"});
countryMap.set("Canada",{lang:"en"});
countryMap.set("Switzerland",{lang:"de"});
countryMap.set("New Zealand",{lang:"en"});

var pageMap = new Map();
pageMap.set("HOME.HTML", { pageName: "/sites/ibi/SitePages/web/Home.aspx", loadConfig: "BASIC" });
pageMap.set("INDEX.HTML", { pageName: "/sites/ibi/SitePages/web/index.aspx", loadConfig: "ALLUSERS" });