const TAG_NUMBER_COLUMN_KEY = "tagNumber";
const TAG_NUMBER_LABEL = "Tag Number";
const TAG_NUMBER_SORT_WIDTH = 10;
const TAG_COUNT_SQL_FIELD =
  "CAST((SELECT COUNT(*) FROM itemTags WHERE itemTags.itemID = items.itemID) AS TEXT)";

type SearchConditionsAPI = {
  get: (condition: string) => any;
  getStandardConditions: () => Array<{
    flags?: Record<string, unknown>;
    localized: string;
    name: string;
    operators?: Record<string, boolean>;
  }>;
  getLocalizedName: (condition: string) => string;
  hasOperator: (condition: string, operator: string) => boolean;
  parseCondition: (condition: string) => [string, string | false];
};

const tagNumberSearchCondition = {
  name: TAG_NUMBER_COLUMN_KEY,
  operators: {
    is: true,
    isNot: true,
    isLessThan: true,
    isGreaterThan: true,
  },
  table: "items",
  field: TAG_COUNT_SQL_FIELD,
  special: false,
};

export function getItemTagCount(item: unknown): number {
  if (!item || typeof (item as { getTags?: unknown }).getTags !== "function") {
    return 0;
  }

  return (item as { getTags: () => unknown[] }).getTags().length;
}

export function getSortableTagCount(item: unknown): string {
  return String(getItemTagCount(item)).padStart(TAG_NUMBER_SORT_WIDTH, "0");
}

export function registerTagNumberColumn(): string | false {
  const registeredDataKey = Zotero.ItemTreeManager.registerColumn({
    pluginID: addon.data.config.addonID,
    dataKey: TAG_NUMBER_COLUMN_KEY,
    label: TAG_NUMBER_LABEL,
    enabledTreeIDs: ["main", "advanced-search"],
    width: "80",
    minWidth: 60,
    showInColumnPicker: true,
    dataProvider: (item: Zotero.Item) => getSortableTagCount(item),
    renderCell: (_index, data, column, _isFirstColumn, doc) => {
      const cell = doc.createElement("span");
      cell.className = `cell ${column.className}`;
      cell.textContent = String(Number(data));
      return cell;
    },
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });

  Zotero.ItemTreeManager.refreshColumns();
  return registeredDataKey;
}

export function installTagNumberSearchCondition(): () => void {
  const searchConditions = Zotero.SearchConditions as SearchConditionsAPI & {
    __ntagsTagNumberInstalled?: boolean;
  };

  if (searchConditions.__ntagsTagNumberInstalled) {
    return () => undefined;
  }

  const original = {
    get: searchConditions.get,
    getStandardConditions: searchConditions.getStandardConditions,
    getLocalizedName: searchConditions.getLocalizedName,
    hasOperator: searchConditions.hasOperator,
    parseCondition: searchConditions.parseCondition,
  };

  const patchedGet = function (condition: string) {
    const [conditionName] = original.parseCondition.call(
      searchConditions,
      condition,
    );
    if (conditionName === TAG_NUMBER_COLUMN_KEY) {
      return tagNumberSearchCondition;
    }
    return original.get.call(searchConditions, condition);
  };
  searchConditions.get = patchedGet;

  const patchedGetStandardConditions = function () {
    const conditions = original.getStandardConditions
      .call(searchConditions)
      .filter((condition) => condition.name !== TAG_NUMBER_COLUMN_KEY);

    conditions.push({
      name: TAG_NUMBER_COLUMN_KEY,
      localized: TAG_NUMBER_LABEL,
      operators: tagNumberSearchCondition.operators,
    });

    const collation = Zotero.getLocaleCollation() as unknown as {
      compareString: (strength: number, a: string, b: string) => number;
    };
    return conditions.sort((a, b) => {
      if (a.name === "anyField") {
        return -1;
      }
      if (b.name === "anyField") {
        return 1;
      }
      return collation.compareString(1, a.localized, b.localized);
    });
  };
  searchConditions.getStandardConditions = patchedGetStandardConditions;

  const patchedGetLocalizedName = function (condition: string) {
    if (condition === TAG_NUMBER_COLUMN_KEY) {
      return TAG_NUMBER_LABEL;
    }
    return original.getLocalizedName.call(searchConditions, condition);
  };
  searchConditions.getLocalizedName = patchedGetLocalizedName;

  const patchedHasOperator = function (condition: string, operator: string) {
    const [conditionName] = original.parseCondition.call(
      searchConditions,
      condition,
    );
    if (conditionName === TAG_NUMBER_COLUMN_KEY) {
      return !!tagNumberSearchCondition.operators[
        operator as keyof typeof tagNumberSearchCondition.operators
      ];
    }
    return original.hasOperator.call(searchConditions, condition, operator);
  };
  searchConditions.hasOperator = patchedHasOperator;

  searchConditions.__ntagsTagNumberInstalled = true;

  return () => {
    if (searchConditions.get === patchedGet) {
      searchConditions.get = original.get;
    }
    if (
      searchConditions.getStandardConditions === patchedGetStandardConditions
    ) {
      searchConditions.getStandardConditions = original.getStandardConditions;
    }
    if (searchConditions.getLocalizedName === patchedGetLocalizedName) {
      searchConditions.getLocalizedName = original.getLocalizedName;
    }
    if (searchConditions.hasOperator === patchedHasOperator) {
      searchConditions.hasOperator = original.hasOperator;
    }
    delete searchConditions.__ntagsTagNumberInstalled;
  };
}
