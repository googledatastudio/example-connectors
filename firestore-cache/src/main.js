// [[start common_connector_code]]
var cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
  return cc
    .newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
}

function getConfig(request) {
  var config = cc.getConfig();

  config
    .newTextInput()
    .setId('zipcode')
    .setName('Enter Zip Code')
    .setPlaceholder('eg. 95054');

  return config.build();
}

function getFields() {
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId('zipcode')
    .setName('Zip code')
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId('date')
    .setName('Date')
    .setType(types.YEAR_MONTH_DAY);

  fields
    .newMetric()
    .setId('temperature')
    .setName('Temperature (F)')
    .setType(types.NUMBER)
    .setIsReaggregatable(false);

  return fields;
}

function getSchema(request) {
  return {
    schema: getFields().build()
  };
}
// [[end common_connector_code]]

// [[start caching_implementation]]
function getData(request) {
  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  var cacheUpdateNeeded = true;
  var url = buildFirebaseUrl(request.configParams.zipcode);
  var cache = firebaseCache('get', url);

  if (cache) {
    var currentYmd = getCurrentYmd();
    cacheUpdateNeeded = currentYmd > cache.ymd;
  }

  if (cacheUpdateNeeded) {
    var fetchedData = fetchAndParseData(request);
    cache = {};
    cache.data = fetchedData;
    cache.ymd = currentYmd;
    firebaseCache('delete', url);
    firebaseCache('post', url, cache);
  }

  var data = getFormattedData(cache.data, requestedFields);

  return {
    schema: requestedFields.build(),
    rows: data
  };
}

function getCurrentYmd() {
  var currentDate = new Date();
  var year = currentDate.getFullYear();
  var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
  var date = ('0' + currentDate.getDate()).slice(-2);
  var currentYmd = year + month + date;
  return currentYmd;
}

// [[end caching_implementation]]

// [[start common_getdata_implementation]]
function fetchAndParseData(request) {
  // You will connect to your own API endpoint and parse the fetched data.
  // To keep the example simple, we are returning dummy data instead of
  // connecting to an enpoint. This does not affect the caching.
  var parsedData = sampleData;
  return parsedData;
}

function getFormattedData(fetchedData, requestedFields) {
  var data = [];
  fetchedData.map(function(rowData) {
    var formattedData = formatData(rowData, requestedFields);
    data = data.concat(formattedData);
  });
  return data;
}

function formatData(rowData, requestedFields) {
  var row = requestedFields.asArray().map(function(requestedField) {
    switch (requestedField.getId()) {
      case 'date':
        return rowData.date;
      case 'zipcode':
        return rowData.zipcode;
      case 'temperature':
        return rowData.temperature;
      default:
        return '';
    }
  });
  return {values: row};
}
// [[end common_getdata_implementation]]

var sampleData = [
  {
    date: '20190601',
    zipcode: '95054',
    temperature: 80
  },
  {
    date: '20190602',
    zipcode: '95054',
    temperature: 82
  },
  {
    date: '20190603',
    zipcode: '95054',
    temperature: 82
  },
  {
    date: '20190604',
    zipcode: '95054',
    temperature: 85
  },
  {
    date: '20190605',
    zipcode: '95054',
    temperature: 84
  },
  {
    date: '20190606',
    zipcode: '95054',
    temperature: 83
  },
  {
    date: '20190607',
    zipcode: '95054',
    temperature: 81
  }
];
