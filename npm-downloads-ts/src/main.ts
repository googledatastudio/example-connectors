const cc = DataStudioApp.createCommunityConnector();
const DEFAULT_PACKAGE = "@google/dscc-gen";

// https://devsite.googleplex.com/datastudio/connector/reference#getauthtype
const getAuthType = (): GetAuthTypeResponse => {
  const AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
};

// https://devsite.googleplex.com/datastudio/connector/reference#isadminuser
const isAdminUser = (): boolean => {
  return false;
};

// https://devsite.googleplex.com/datastudio/connector/reference#getconfig
const getConfig = (request: GetConfigRequest): GetConfigResponse => {
  const config = cc.getConfig();

  config
    .newInfo()
    .setId("instructions")
    .setText(
      "Enter one or more npm package names to fetch their download count."
    );

  config
    .newTextInput()
    .setId("package")
    .setName("Enter one or more package names separated by commas.")
    .setHelpText('e.g. "googleapis" or "@google/dscc-gen,@google/dscc-scripts"')
    .setPlaceholder(DEFAULT_PACKAGE)
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
};

type Fields = GoogleAppsScript.Data_Studio.Fields;
const getFields = (): Fields => {
  const fields = cc.getFields();
  const types = cc.FieldType;
  const aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId("packageName")
    .setName("Package")
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId("day")
    .setName("Date")
    .setType(types.YEAR_MONTH_DAY);

  fields
    .newMetric()
    .setId("downloads")
    .setName("Downloads")
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  return fields;
};

// https://devsite.googleplex.com/datastudio/connector/reference#getschema
const getSchema = (request: GetSchemaRequest): GetSchemaResponse => {
  return { schema: getFields().build() };
};

type DashedDate = string; // "2014-01-01"
interface PackageData {
  downloads: Array<{
    day: DashedDate;
    downloads: number;
  }>;
  start: DashedDate;
  end: DashedDate;
  package: string;
}

const logObject = (s: any) => {
  cc.newDebugError()
    .setText(JSON.stringify(s))
    .throwException();
};

// https://devsite.googleplex.com/datastudio/connector/reference#getdata
const getData = (request: GetDataRequest): GetDataResponse => {
  try {
    const requestedFields = getFields().forIds(
      request.fields.map(({ name }) => name)
    );
    let { package = DEFAULT_PACKAGE } = request.configParams || {};
    const packages = package.split(",").map(s => s.trim());

    const bulkPackages = packages.filter(p => p[0] !== "@");
    const nonBulkPackages = packages.filter(p => p[0] === "@");

    const bulkRequestData = [bulkPackages.join(","), bulkPackages.length > 1];
    const nonBulkRequestData = nonBulkPackages.map(a => [a, false]);

    const requestData = nonBulkRequestData.concat([bulkRequestData]);

    const responses = requestData
      .map(([package, bulkRequest]: [string, boolean]) =>
        fetchPackagesData(request.dateRange, package, bulkRequest)
      )
      .reduce((acc, a) => acc.concat(a), []);

    const data = toGetDataRows(responses, requestedFields);
    return {
      schema: requestedFields.build(),
      rows: data
    };
  } catch (e) {
    cc.newUserError()
      .setDebugText("Error fetching data from API. Exception details: " + e)
      .setText(
        "The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists."
      )
      .throwException();
  }
};

const normalizeAPIResponse = (
  jsonString: string,
  bulkRequest: boolean = false
): PackageData[] => {
  const parsed = JSON.parse(jsonString);
  if (bulkRequest) {
    // The bulk requests are keyed by package name, but since PackageData also
    // has the name, we can just flatten this down.
    return Object.keys(parsed).map(parsedKey => parsed[parsedKey]);
  }
  return [parsed];
};

const fetchPackagesData = (
  dateRange: GetDataRequest["dateRange"],
  packagesString: string,
  bulkRequest: boolean
): PackageData[] => {
  const { startDate, endDate } = dateRange;
  const range = `${startDate}:${endDate}`;
  const url = `https://api.npmjs.org/downloads/range/${range}/${packagesString}`;
  const response = UrlFetchApp.fetch(url);
  const jsonString = response.getContentText();
  return normalizeAPIResponse(jsonString, bulkRequest);
};

const toGetDataRows = (
  response: PackageData[],
  requestedFields: Fields
): GetDataRows => {
  const data: GetDataRows = [];
  response.forEach((packageData: PackageData) => {
    packageData.downloads.forEach(downloads => {
      const row: GetDataRowValue[] = requestedFields
        .asArray()
        .map(requestedField => {
          switch (requestedField.getId()) {
            case "day":
              return downloads.day.replace(/-/g, "");
            case "downloads":
              return downloads.downloads;
            case "packageName":
              return packageData.package;
            default:
              return "";
          }
        });
      data.push({ values: row });
    });
  });
  return data;
};
