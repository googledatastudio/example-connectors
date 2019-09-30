// https://developers.google.com/datastudio/connector/reference#isadminuser
function isAdminUser() {
  return false;
}

// [start get_config_dynamic_dropdowns]
var cc = DataStudioApp.createCommunityConnector();

function optionsForState(state) {
  switch (state) {
    case 'IL': {
      return [
        {label: 'Chicago', value: 'CHI'},
        {label: 'Springfield', value: 'SPI'}
      ];
    }
    case 'CA': {
      return [
        {label: 'Mountain View', value: 'MTV'},
        {label: 'San Francisco', value: 'SFO'}
      ];
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
  // For the initial getConfig request, request.configParams will be undefined.
  // For subsequent requests, it'll include the configuration so far.
  var isFirstRequest = configParams === undefined;
  var config = cc.getConfig();

  config
    .newSelectSingle()
    .setId('state')
    .setName('State')
    // Changing this field changes the options that are provided below. Setting
    // isDynamic(true), will cause DS to clear later config answers if the user
    // changes the state.
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
    // Tell DS that this is a stepped config request. This will make the 'NEXT'
    // button show.
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
    cityOptions.forEach(function(option) {
      city.addOption(
        config
          .newOptionBuilder()
          .setLabel(option.label)
          .setValue(option.value)
      );
    });
  }
  return config.build();
}
// [end get_config_dynamic_dropdowns]

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
    // This isn't strictly necessary, but having a metric makes this connector
    // work with more chart types.
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
