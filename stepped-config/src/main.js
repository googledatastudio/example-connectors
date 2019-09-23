var cc = DataStudioApp.createCommunityConnector();

// https://developers.google.com/datastudio/connector/reference#isadminuser
function isAdminUser() {
  return false;
}

function optionsForState(state) {
  switch (state) {
    case 'IL': {
      return [['Chicago', 'CHI'], ['Springfield', 'SPI']];
    }
    case 'CA': {
      return [['Mountain View', 'MTV'], ['San Francisco', 'SFO']];
    }
    default: {
      cc.newUserError()
        .setText('You must either select "CA" or "IL"')
        .throwException();
    }
  }
}

function getConfig(request) {
  var configParams = request.configParams;
  var isFirstRequest = configParams === undefined;
  var config = cc.getConfig();

  config
    .newSelectSingle()
    .setId('state')
    .setName('State')
    .setIsDynamic(true)
    .addOption(
      config
        .newOptionBuilder()
        .setLabel('Illinois')
        .setValue('IL')
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel('California')
        .setValue('CA')
    );

  if (isFirstRequest) {
    config.setIsSteppedConfig(true);
  } else {
    // validate a valid value was selected for configParams.state
    if (configParams.state === undefined) {
      cc.newUserError()
        .setText('You must choose a state.')
        .throwException();
    }
    var city = config
      .newSelectSingle()
      .setId('city')
      .setName('City');
    // In a real connector, optionsForState would fetch the choices from an endpoint.
    var cityOptions = optionsForState(configParams.state);
    cityOptions.forEach(function(labelAndValue) {
      var cityLabel = labelAndValue[0];
      var cityValue = labelAndValue[1];
      city.addOption(
        config
          .newOptionBuilder()
          .setLabel(cityLabel)
          .setValue(cityValue)
      );
    });
  }
  return config.build();
}

function getFields() {
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields
    .newDimension()
    .setId('state')
    .setName('State')
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId('city')
    .setName('City')
    .setType(types.TEXT);

  fields
    .newMetric()
    .setId('always_one')
    .setName('Always One')
    .setType(types.NUMBER);

  return fields;
}

// https://developers.google.com/datastudio/connector/reference#getschema
function getSchema(request) {
  return {schema: getFields().build()};
}

// https://developers.google.com/datastudio/connector/reference#getdata
function getData(request) {
  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  var row = [];
  requestedFields.asArray().forEach(function(field) {
    switch (field.getId()) {
      case 'state':
        row.push(request.configParams.state);
        break;
      case 'city':
        row.push(request.configParams.city);
        break;
      case 'always_one':
        row.push(1);
        break;
      default:
        row.push('');
        break;
    }
  });
  var rows = [{values: row}];

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}
