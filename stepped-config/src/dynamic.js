// [start get_config_branching_paths]
var cc = DataStudioApp.createCommunityConnector();

function getConfig(request) {
  var configParams = request.configParams;
  // For the initial getConfig request, request.configParams will be undefined.
  // For subsequent requests, it'll include the configuration so far.
  var isFirstRequest = configParams === undefined;
  var config = cc.getConfig();

  config
    .newSelectSingle()
    .setId('country')
    .setName('Country')
    // Set isDynamic to true so any changes to Country will clear the state
    // selections.
    .setIsDynamic(true)
    .addOption(
      config
        .newOptionBuilder()
        .setLabel('United States')
        .setValue('USA')
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel('Canada')
        .setValue('CA')
    );

  if (isFirstRequest) {
    // Tell DS that this is a stepped config request. This will make the 'NEXT'
    // button show.
    config.setIsSteppedConfig(true);
  } else {
    // validate a valid value was selected for configParams.country
    if (configParams.country === undefined) {
      cc.newUserError()
        .setText('You must choose a country.')
        .throwException();
    }
    switch (configParams.country) {
      case 'USA': {
        config
          .newSelectSingle()
          .setId('state')
          .setName('State')
          .addOption(
            config
              .newOptionBuilder()
              .setLabel('New York')
              .setValue('NY')
          )
          .addOption(
            config
              .newOptionBuilder()
              .setLabel('Calfornia')
              .setValue('CA')
          );
        break;
      }
      case 'CA': {
        // No additional configuration is needed for Canada.
        break;
      }
      default: {
        cc.newUserError()
          .setText('You must either select "CA" or "USA"')
          .throwException();
      }
    }
  }
  return config.build();
}
// [end get_config_branching_paths]
