enum AuthType {
  NONE
}

enum FieldType {
  NUMBER,
  TEXT
}

enum AggregationType {
  SUM
}

export interface GetAuthTypeResponse {}

export interface AuthTypeResponseBuilder {
  setAuthType: (authType: AuthType) => AuthTypeResponseBuilder;
  build: () => GetAuthTypeResponse;
}

interface InfoBuilder {
  setId: (id: string) => this;
  setText: (text: string) => this;
}

interface SelectSingleBuilder {
  setId: (id: string) => this;
  setName: (name: string) => this;
  setHelpText: (helpText: string) => this;
  setAllowOverride: (allowOverride: boolean) => this;
  addOption: (optionBuilder: OptionBuilder) => this;
}

interface OptionBuilder {
  setLabel: (label: string) => this;
  setValue: (value: string) => this;
}

interface GetConfigResponse {}

interface GetConfigResponseBuilder {
  newInfo: () => InfoBuilder;
  newSelectSingle: () => SelectSingleBuilder;
  newOptionBuilder: () => OptionBuilder;
  build: () => GetConfigResponse;
}

interface FieldBuilder {
  getId: () => string;
  setId: (id: string) => this;
  setName: (name: string) => this;
  setType: (type: FieldType) => this;
  setAggregation: (aggregation: AggregationType) => this;
}

interface Fields {}

interface FieldsBuilder {
  newDimension: () => FieldBuilder;
  newMetric: () => FieldBuilder;
  build: () => Fields;
  forIds: (ids: string[]) => FieldsBuilder;
  asArray: () => Array<FieldBuilder>;
}

export interface CommunityConnector {
  AuthType: typeof AuthType;
  FieldType: typeof FieldType;
  AggregationType: typeof AggregationType;
  newAuthTypeResponse: () => AuthTypeResponseBuilder;
  getConfig: () => GetConfigResponseBuilder;
  getFields: () => FieldsBuilder;
}

export interface DataStudioApp {
  createCommunityConnector: () => CommunityConnector;
}

interface GetSchemaRequest {}

interface GetSchemaResponse {}

interface GetConfigRequest {}

interface GetDataField {
  name: string;
}

interface GetDataRequest {
  fields: Array<GetDataField>;
  configParams: { [key: string]: string };
}

type GetDataRowValue = string | number | boolean;

interface GetDataRow {
  values: Array<GetDataRowValue>;
}

type GetDataRows = Array<GetDataRow>;

interface GetDataResponse {
  schema: Fields;
  rows: GetDataRows;
}

declare const DataStudioApp: DataStudioApp;

// TODO - make proper type.
declare const UrlFetchApp: any;

// END TYPES I MADE UP.

// https://devsite.googleplex.com/datastudio/connector/reference#getauthtype
function getAuthType(): GetAuthTypeResponse {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

var cc = DataStudioApp.createCommunityConnector();

// https://devsite.googleplex.com/datastudio/connector/reference#isadminuser
function isAdminUser(): boolean {
  return false;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getconfig
function getConfig(request: GetConfigRequest): GetConfigResponse {
  var config = cc.getConfig();

  config
    .newInfo()
    .setId("generalInfo")
    .setText(
      "This is the template connector created by https://github.com/googledatastudio/dscc-gen"
    );

  config
    .newSelectSingle()
    .setId("units")
    .setName("Units")
    .setHelpText("Metric or Imperial Units")
    .setAllowOverride(true)
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("Metric")
        .setValue("metric")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("Imperial")
        .setValue("imperial")
    );

  return config.build();
}

function getFields(): FieldsBuilder {
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId("id")
    .setName("Id")
    .setType(types.TEXT);

  fields
    .newMetric()
    .setId("distance")
    .setName("Distance")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  return fields;
}

// https://devsite.googleplex.com/datastudio/connector/reference#getschema
function getSchema(request: GetSchemaRequest): GetSchemaResponse {
  return { schema: getFields().build() };
}

// https://devsite.googleplex.com/datastudio/connector/reference#getdata
function getData(request: GetDataRequest): GetDataResponse {
  // Calling `UrlFetchApp.fetch()` makes this connector require authentication.
  UrlFetchApp.fetch("https://google.com");

  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  // Convert from miles to kilometers if 'metric' units were picked.
  var unitMultiplier = 1;
  if (request.configParams.units === "metric") {
    unitMultiplier = 1.60934;
  }

  var rows: GetDataRows = [];
  for (var i = 0; i < 100; i++) {
    var row: Array<GetDataRowValue> = [];
    requestedFields.asArray().forEach(function(field) {
      switch (field.getId()) {
        case "id":
          return row.push("id_" + i);
        case "distance":
          return row.push(i * unitMultiplier);
        default:
          return row.push("");
      }
    });
    rows.push({ values: row });
  }

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}
