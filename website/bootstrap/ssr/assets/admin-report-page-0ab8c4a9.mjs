import { jsxs, jsx } from "react/jsx-runtime";
import { lazy, Suspense, useMemo, useRef, useCallback, useEffect, memo, Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { a as apiClient, a2 as ProgressCircle, T as Trans, aR as shallowEqual, aA as getBootstrapData, a_ as useSelectedLocale, k as useTrans, u as useSettings, bf as useThemeSelector, m as message, bg as lazyLoader, e as createSvgIcon, j as DialogTrigger, d as IconButton, D as Dialog, g as DialogHeader, h as DialogBody, B as Button, Y as createSvgIconFromTree, b as useIsMobileMediaQuery, ad as DateFormatPresets, q as StaticPageTitle } from "../server-entry.mjs";
import { T as TrendingUpIcon, a as TrendingFlatIcon, b as TrendingDownIcon } from "./TrendingUp-58bc999b.mjs";
import clsx from "clsx";
import { DateFormatter, parseAbsoluteToLocal } from "@internationalized/date";
import memoize from "nano-memoize";
import { Q as ArrowBackIcon, a3 as FormattedNumber, a4 as FormattedDateTimeRange, a5 as DateRangeIcon, a6 as useDateRangePickerState, a7 as DateRangeDialog, a8 as DateRangePresets } from "./UnfoldMore-a9683c4c.mjs";
import { t as themeValueToHex, F as FormattedBytes } from "./admin-routes-31de440a.mjs";
import "react-dom/server";
import "process";
import "http";
import "axios";
import "react-router-dom/server.mjs";
import "framer-motion";
import "zustand";
import "zustand/middleware/immer";
import "nanoid";
import "react-router-dom";
import "deepmerge";
import "@internationalized/number";
import "@react-stately/utils";
import "@react-aria/utils";
import "@floating-ui/react-dom";
import "react-merge-refs";
import "@react-aria/focus";
import "react-dom";
import "@react-aria/ssr";
import "react-hook-form";
import "dot-object";
import "immer";
import "axios-retry";
import "tus-js-client";
import "react-use-cookie";
import "mime-match";
import "react-use-clipboard";
import "@react-aria/interactions";
import "./Edit-ce7ae1ac.mjs";
import "zustand/middleware";
import "react-colorful";
import "@react-stately/color";
import "deep-object-diff";
import "@tanstack/react-virtual";
import "./use-resume-subscription-78518032.mjs";
import "slugify";
const Endpoint = "admin/reports";
function useAdminReport(payload = {}) {
  return useQuery([Endpoint, payload], () => fetchAnalyticsReport(payload), {
    keepPreviousData: true
  });
}
function fetchAnalyticsReport({
  types,
  dateRange
}) {
  const params = {};
  if (types) {
    params.types = types.join(",");
  }
  if (dateRange) {
    params.startDate = dateRange.start.toAbsoluteString();
    params.endDate = dateRange.end.toAbsoluteString();
    params.timezone = dateRange.start.timeZone;
  }
  return apiClient.get(Endpoint, { params }).then((response) => response.data);
}
function ChartLayout(props) {
  const {
    title,
    description,
    children,
    className,
    contentIsFlex = true,
    contentClassName,
    contentRef,
    minHeight = "min-h-440"
  } = props;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        "bg border rounded h-full flex flex-col flex-auto",
        minHeight,
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs p-14 flex-shrink-0 flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm", children: title }),
          description && /* @__PURE__ */ jsx("div", { className: "text-muted", children: description })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: contentRef,
            className: clsx(
              "p-14 relative",
              contentIsFlex && "flex-auto flex items-center justify-center",
              contentClassName
            ),
            children
          }
        )
      ]
    }
  );
}
function ChartLoadingIndicator() {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-10 text-sm absolute mx-auto", children: [
    /* @__PURE__ */ jsx(ProgressCircle, { isIndeterminate: true, size: "sm" }),
    /* @__PURE__ */ jsx(Trans, { message: "Chart loading" })
  ] });
}
const LazyChart = lazy(() => import("./lazy-chart-9300132f.mjs"));
function BaseChart(props) {
  const { title, description, className, contentRef, isLoading } = props;
  return /* @__PURE__ */ jsx(
    ChartLayout,
    {
      title,
      description,
      className,
      contentRef,
      children: /* @__PURE__ */ jsxs(Suspense, { fallback: /* @__PURE__ */ jsx(ChartLoadingIndicator, {}), children: [
        /* @__PURE__ */ jsx(LazyChart, { ...props }),
        isLoading && /* @__PURE__ */ jsx(ChartLoadingIndicator, {})
      ] })
    }
  );
}
function formatReportData(report, { localeCode = "en", shareFirstDatasetLabels = true }) {
  if (!report)
    return { datasets: [] };
  const firstDatasetLabels = [];
  return {
    ...report,
    datasets: report.datasets.map((dataset, datasetIndex) => {
      const data = dataset.data.map((datasetItem, itemIndex) => {
        let label;
        if (datasetIndex === 0 || !shareFirstDatasetLabels) {
          label = generateDatasetLabels(
            datasetItem,
            report.granularity,
            localeCode
          );
          firstDatasetLabels[itemIndex] = label;
        } else {
          label = firstDatasetLabels[itemIndex];
        }
        return {
          ...label,
          value: datasetItem.value
        };
      });
      return { ...dataset, data };
    })
  };
}
function generateDatasetLabels(datum, granularity, locale) {
  if (datum.label != null) {
    return { label: datum.label };
  }
  if (!datum.date) {
    return { label: "" };
  }
  return generateTimeLabels(datum, granularity, locale);
}
function generateTimeLabels({ date: isoDate, endDate: isoEndDate, value }, granularity = "day", locale) {
  const date = parseAbsoluteToLocal(isoDate).toDate();
  const endDate = isoEndDate ? parseAbsoluteToLocal(isoEndDate).toDate() : null;
  switch (granularity) {
    case "minute":
      return {
        label: getFormatter(locale, {
          second: "2-digit"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          day: "2-digit",
          hour: "numeric",
          minute: "numeric",
          second: "2-digit"
        }).format(date)
      };
    case "hour":
      return {
        label: getFormatter(locale, {
          hour: "numeric",
          minute: "numeric"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          month: "short",
          day: "2-digit",
          hour: "numeric",
          minute: "numeric"
        }).format(date)
      };
    case "day":
      return {
        label: getFormatter(locale, {
          day: "2-digit",
          weekday: "short"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          day: "2-digit",
          weekday: "short",
          month: "short"
        }).format(date)
      };
    case "week":
      return {
        label: getFormatter(locale, {
          month: "short",
          day: "2-digit"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }).formatRange(date, endDate)
      };
    case "month":
      return {
        label: getFormatter(locale, {
          month: "short",
          year: "numeric"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          month: "long",
          year: "numeric"
        }).format(date)
      };
    case "year":
      return {
        label: getFormatter(locale, {
          year: "numeric"
        }).format(date),
        tooltipTitle: getFormatter(locale, {
          year: "numeric"
        }).format(date)
      };
  }
}
const getFormatter = memoize(
  (locale, options) => {
    return new DateFormatter(locale, options);
  },
  {
    equals: (a, b) => {
      return shallowEqual(a, b);
    },
    callTimeout: void 0
  }
);
const primaryColor = getBootstrapData().themes.all[0].colors["--be-primary"];
const ChartColors = [
  [
    `rgb(${primaryColor.replaceAll(" ", ",")})`,
    `rgba(${primaryColor.replaceAll(" ", ",")},0.2)`
  ],
  ["rgb(255,112,67)", "rgb(255,112,67,0.2)"],
  ["rgb(255,167,38)", "rgb(255,167,38,0.2)"],
  ["rgb(141,110,99)", "rgb(141,110,99,0.2)"],
  ["rgb(102,187,106)", "rgba(102,187,106,0.2)"],
  ["rgb(92,107,192)", "rgb(92,107,192,0.2)"]
];
const LineChartOptions = {
  parsing: {
    xAxisKey: "label",
    yAxisKey: "value"
  },
  datasets: {
    line: {
      fill: "origin",
      tension: 0.1,
      pointBorderWidth: 4,
      pointHitRadius: 10
    }
  },
  plugins: {
    tooltip: {
      intersect: false,
      mode: "index"
    }
  }
};
function LineChart({ data, className, ...props }) {
  const { localeCode } = useSelectedLocale();
  const formattedData = useMemo(() => {
    const formattedData2 = formatReportData(data, { localeCode });
    formattedData2.datasets = formattedData2.datasets.map((dataset, i) => ({
      ...dataset,
      backgroundColor: ChartColors[i][1],
      borderColor: ChartColors[i][0],
      pointBackgroundColor: ChartColors[i][0]
    }));
    return formattedData2;
  }, [data, localeCode]);
  return /* @__PURE__ */ jsx(
    BaseChart,
    {
      ...props,
      className: clsx(className, "min-w-500"),
      data: formattedData,
      type: "line",
      options: LineChartOptions
    }
  );
}
const PolarAreaChartOptions = {
  parsing: {
    key: "value"
  },
  plugins: {
    tooltip: {
      intersect: true
    }
  }
};
function PolarAreaChart({
  data,
  className,
  ...props
}) {
  const { localeCode } = useSelectedLocale();
  const formattedData = useMemo(() => {
    var _a;
    const formattedData2 = formatReportData(data, { localeCode });
    formattedData2.labels = (_a = formattedData2.datasets[0]) == null ? void 0 : _a.data.map((d) => d.label);
    formattedData2.datasets = formattedData2.datasets.map((dataset, i) => ({
      ...dataset,
      backgroundColor: ChartColors.map((c) => c[1]),
      borderColor: ChartColors.map((c) => c[0]),
      borderWidth: 2
    }));
    return formattedData2;
  }, [data, localeCode]);
  return /* @__PURE__ */ jsx(
    BaseChart,
    {
      type: "polarArea",
      data: formattedData,
      options: PolarAreaChartOptions,
      className: clsx(className, "min-w-500"),
      ...props
    }
  );
}
function BarChart({
  data,
  direction = "vertical",
  individualBarColors = false,
  className,
  ...props
}) {
  const { localeCode } = useSelectedLocale();
  const formattedData = useMemo(() => {
    const formattedData2 = formatReportData(data, { localeCode });
    formattedData2.datasets = formattedData2.datasets.map((dataset, i) => ({
      ...dataset,
      backgroundColor: individualBarColors ? ChartColors.map((c) => c[1]) : ChartColors[i][1],
      borderColor: individualBarColors ? ChartColors.map((c) => c[0]) : ChartColors[i][0],
      borderWidth: 2
    }));
    return formattedData2;
  }, [data, localeCode, individualBarColors]);
  const isHorizontal = direction === "horizontal";
  const options = useMemo(() => {
    return {
      indexAxis: isHorizontal ? "y" : "x",
      parsing: {
        xAxisKey: isHorizontal ? "value" : "label",
        yAxisKey: isHorizontal ? "label" : "value"
      }
    };
  }, [isHorizontal]);
  return /* @__PURE__ */ jsx(
    BaseChart,
    {
      type: "bar",
      className: clsx(className, "min-w-500"),
      data: formattedData,
      options,
      ...props
    }
  );
}
const loaderUrl = "https://www.gstatic.com/charts/loader.js";
function useGoogleGeoChart({
  placeholderRef,
  data,
  country,
  onCountrySelected
}) {
  const { trans } = useTrans();
  const { analytics } = useSettings();
  const apiKey = analytics == null ? void 0 : analytics.gchart_api_key;
  const { selectedTheme } = useThemeSelector();
  const geoChartRef = useRef();
  const regionInteractivity = !!onCountrySelected && !country;
  const drawGoogleChart = useCallback(() => {
    var _a, _b;
    if (typeof google === "undefined")
      return;
    const seedData = data.map((location) => [location.label, location.value]);
    seedData.unshift([
      country ? trans(message("City")) : trans(message("Country")),
      trans(message("Clicks"))
    ]);
    const backgroundColor = `${themeValueToHex(
      selectedTheme.colors["--be-paper"]
    )}`;
    const chartColor = `${themeValueToHex(
      selectedTheme.colors["--be-primary"]
    )}`;
    const options = {
      colorAxis: { colors: [chartColor] },
      backgroundColor,
      region: country ? country.toUpperCase() : void 0,
      resolution: country ? "provinces" : "countries",
      displayMode: country ? "markers" : "regions",
      enableRegionInteractivity: regionInteractivity
    };
    if (!geoChartRef.current && placeholderRef.current && ((_a = google == null ? void 0 : google.visualization) == null ? void 0 : _a.GeoChart)) {
      geoChartRef.current = new google.visualization.GeoChart(
        placeholderRef.current
      );
    }
    (_b = geoChartRef.current) == null ? void 0 : _b.draw(
      google.visualization.arrayToDataTable(seedData),
      options
    );
  }, [
    selectedTheme,
    data,
    placeholderRef,
    trans,
    country,
    regionInteractivity
  ]);
  const initGoogleGeoChart = useCallback(async () => {
    if (lazyLoader.isLoadingOrLoaded(loaderUrl))
      return;
    await lazyLoader.loadAsset(loaderUrl, { type: "js" });
    await google.charts.load("current", {
      packages: ["geochart"],
      mapsApiKey: apiKey
    });
    drawGoogleChart();
  }, [apiKey, drawGoogleChart]);
  useEffect(() => {
    if (geoChartRef.current && onCountrySelected) {
      google.visualization.events.addListener(
        geoChartRef.current,
        "regionClick",
        (a) => onCountrySelected == null ? void 0 : onCountrySelected(a.region)
      );
    }
    return () => {
      if (geoChartRef.current) {
        google.visualization.events.removeAllListeners(geoChartRef.current);
      }
    };
  }, [onCountrySelected, geoChartRef.current]);
  useEffect(() => {
    initGoogleGeoChart();
  }, [initGoogleGeoChart]);
  useEffect(() => {
    drawGoogleChart();
  }, [selectedTheme, drawGoogleChart, data]);
  return { drawGoogleChart };
}
const InfoDialogTriggerIcon = createSvgIcon(
  /* @__PURE__ */ jsx("path", { d: "M9 8a1 1 0 0 0-1-1H5.5a1 1 0 1 0 0 2H7v4a1 1 0 0 0 2 0zM4 0h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4zm4 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" }),
  "InfoDialogTrigger"
);
function InfoDialogTrigger({
  title,
  body,
  dialogSize = "sm",
  className
}) {
  return /* @__PURE__ */ jsxs(DialogTrigger, { type: "popover", triggerOnHover: true, children: [
    /* @__PURE__ */ jsx(
      IconButton,
      {
        className: clsx("text-muted opacity-70", className),
        size: "xs",
        children: /* @__PURE__ */ jsx(InfoDialogTriggerIcon, { viewBox: "0 0 16 16" })
      }
    ),
    /* @__PURE__ */ jsxs(Dialog, { size: dialogSize, children: [
      title && /* @__PURE__ */ jsx(DialogHeader, { padding: "px-18 pt-12", size: "md", hideDismissButton: true, children: title }),
      /* @__PURE__ */ jsx(DialogBody, { children: body })
    ] })
  ] });
}
const FormattedCountryName = memo(({ code: countryCode }) => {
  const { localeCode } = useSelectedLocale();
  const regionNames = new Intl.DisplayNames([localeCode], { type: "region" });
  let formattedName;
  try {
    formattedName = regionNames.of(countryCode.toUpperCase());
  } catch (e) {
  }
  return /* @__PURE__ */ jsx(Fragment, { children: formattedName });
});
function GeoChart({
  data: metricData,
  isLoading,
  onCountrySelected,
  country,
  ...layoutProps
}) {
  const placeholderRef = useRef(null);
  const regionInteractivity = !!onCountrySelected;
  const initialData = metricData == null ? void 0 : metricData.datasets[0].data;
  const data = useMemo(() => {
    return initialData || [];
  }, [initialData]);
  useGoogleGeoChart({ placeholderRef, data, country, onCountrySelected });
  return /* @__PURE__ */ jsxs(
    ChartLayout,
    {
      ...layoutProps,
      className: "min-w-500",
      title: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx(Trans, { message: "Top Locations" }),
        country ? /* @__PURE__ */ jsxs("span", { className: "pl-4", children: [
          "(",
          /* @__PURE__ */ jsx(FormattedCountryName, { code: country }),
          ")"
        ] }) : null,
        regionInteractivity && /* @__PURE__ */ jsx(InfoTrigger, {})
      ] }),
      contentIsFlex: isLoading,
      children: [
        isLoading && /* @__PURE__ */ jsx(ChartLoadingIndicator, {}),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-24", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              ref: placeholderRef,
              className: "flex-auto w-[480px] min-h-[340px]"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "w-[170px]", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm max-h-[340px] w-full flex-initial overflow-y-auto", children: data.map((location) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: clsx(
                  "flex items-center gap-4 mb-4",
                  regionInteractivity && "cursor-pointer hover:underline"
                ),
                role: regionInteractivity ? "button" : void 0,
                onClick: () => {
                  onCountrySelected == null ? void 0 : onCountrySelected(location.code);
                },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "max-w-110 whitespace-nowrap overflow-hidden overflow-ellipsis", children: location.label }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    "(",
                    location.percentage,
                    ")%"
                  ] })
                ]
              },
              location.label
            )) }),
            country && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "xs",
                className: "mt-14",
                startIcon: /* @__PURE__ */ jsx(ArrowBackIcon, {}),
                onClick: () => {
                  onCountrySelected == null ? void 0 : onCountrySelected(void 0);
                },
                children: /* @__PURE__ */ jsx(Trans, { message: "Back to countries" })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function InfoTrigger() {
  return /* @__PURE__ */ jsx(
    InfoDialogTrigger,
    {
      title: /* @__PURE__ */ jsx(Trans, { message: "Zooming in" }),
      body: /* @__PURE__ */ jsx(Trans, { message: "Click on a country inside the map or country list to zoom in and see city data for that country." })
    }
  );
}
const AdminReportPageColGap = "gap-12 md:gap-24 mb-12 md:mb-24";
const rowClassName = `flex flex-col md:flex-row md:items-center overflow-x-auto ${AdminReportPageColGap}`;
function VisitorsReportCharts({
  report,
  isLoading
}) {
  const totalViews = report == null ? void 0 : report.pageViews.total;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: rowClassName, children: [
      /* @__PURE__ */ jsx(
        LineChart,
        {
          isLoading,
          className: "flex-auto",
          data: report == null ? void 0 : report.pageViews,
          title: /* @__PURE__ */ jsx(Trans, { message: "Pageviews" }),
          description: totalViews ? /* @__PURE__ */ jsx(
            Trans,
            {
              message: ":count total views",
              values: { count: /* @__PURE__ */ jsx(FormattedNumber, { value: totalViews }) }
            }
          ) : null
        }
      ),
      /* @__PURE__ */ jsx(
        PolarAreaChart,
        {
          isLoading,
          data: report == null ? void 0 : report.devices,
          title: /* @__PURE__ */ jsx(Trans, { message: "Top devices" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: rowClassName, children: [
      /* @__PURE__ */ jsx(
        BarChart,
        {
          isLoading,
          data: report == null ? void 0 : report.browsers,
          className: "flex-auto md:w-1/3",
          direction: "horizontal",
          individualBarColors: true,
          hideLegend: true,
          title: /* @__PURE__ */ jsx(Trans, { message: "Top browsers" })
        }
      ),
      /* @__PURE__ */ jsx(
        GeoChart,
        {
          isLoading,
          className: "flex-auto",
          data: report == null ? void 0 : report.locations,
          title: /* @__PURE__ */ jsx(Trans, { message: "Top locations" })
        }
      )
    ] })
  ] });
}
function AdminHeaderReport({ report, dateRange }) {
  /* @__PURE__ */ jsx(FormattedDateTimeRange, { start: dateRange.start, end: dateRange.end });
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `flex items-center flex-shrink-0 overflow-x-auto h-[97px] ${AdminReportPageColGap}`,
      children: report == null ? void 0 : report.map((datum) => /* @__PURE__ */ jsx(ValueMetricItem, { datum }, datum.name))
    }
  );
}
function ValueMetricItem({ datum, label }) {
  const Icon = createSvgIconFromTree(datum.icon);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex items-center flex-auto rounded border p-20 gap-18 h-full whitespace-nowrap",
      children: [
        /* @__PURE__ */ jsx("div", { className: "bg-primary-light/20 rounded-lg p-10 flex-shrink-0", children: /* @__PURE__ */ jsx(Icon, { size: "lg", className: "text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-20 justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "text-main text-lg font-bold", children: datum.type === "fileSize" ? /* @__PURE__ */ jsx(FormattedBytes, { bytes: datum.currentValue }) : /* @__PURE__ */ jsx(FormattedNumber, { value: datum.currentValue }) }),
            label && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted ml-auto", children: label })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-20 justify-between", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-muted text-sm", children: datum.name }),
            datum.percentageChange != null && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-10", children: /* @__PURE__ */ jsx(TrendingIndicator, { percentage: datum.percentageChange }) })
          ] })
        ] })
      ]
    },
    datum.name
  );
}
function TrendingIndicator({ percentage }) {
  let icon;
  if (percentage > 0) {
    icon = /* @__PURE__ */ jsx(TrendingUpIcon, { size: "md", className: "text-positive" });
  } else if (percentage === 0) {
    icon = /* @__PURE__ */ jsx(TrendingFlatIcon, { className: "text-muted" });
  } else {
    icon = /* @__PURE__ */ jsx(TrendingDownIcon, { className: "text-danger" });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    icon,
    /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold text-muted", children: [
      percentage,
      "%"
    ] })
  ] });
}
const monthDayFormat = {
  month: "short",
  day: "2-digit"
};
function ReportDateSelector({
  value,
  onChange,
  compactOnMobile = true
}) {
  const isMobile = useIsMobileMediaQuery();
  return /* @__PURE__ */ jsxs(
    DialogTrigger,
    {
      type: "popover",
      onClose: (value2) => {
        if (value2) {
          onChange(value2);
        }
      },
      children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", color: "chip", endIcon: /* @__PURE__ */ jsx(DateRangeIcon, {}), children: /* @__PURE__ */ jsx(
          FormattedDateTimeRange,
          {
            start: value.start,
            end: value.end,
            options: isMobile && compactOnMobile ? monthDayFormat : DateFormatPresets.short
          }
        ) }),
        /* @__PURE__ */ jsx(DateSelectorDialog, { value })
      ]
    }
  );
}
function DateSelectorDialog({ value }) {
  const isMobile = useIsMobileMediaQuery();
  const state = useDateRangePickerState({
    defaultValue: value,
    closeDialogOnSelection: false
  });
  return /* @__PURE__ */ jsx(DateRangeDialog, { state, showInlineDatePickerField: !isMobile });
}
function AdminReportPage() {
  const [dateRange, setDateRange] = useState(() => {
    return DateRangePresets[2].getRangeValue();
  });
  const { isLoading, data } = useAdminReport({ dateRange });
  const title = /* @__PURE__ */ jsx(Trans, { message: "Visitors report" });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-full gap-12 md:gap-24 p-12 md:p-24 overflow-x-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "md:flex items-center justify-between gap-24 mb-24", children: [
      /* @__PURE__ */ jsx(StaticPageTitle, { children: title }),
      /* @__PURE__ */ jsx("h1", { className: "mb-24 md:mb-0 text-3xl font-light", children: title }),
      /* @__PURE__ */ jsx(ReportDateSelector, { value: dateRange, onChange: setDateRange })
    ] }),
    /* @__PURE__ */ jsx(AdminHeaderReport, { report: data == null ? void 0 : data.headerReport, dateRange }),
    /* @__PURE__ */ jsx(
      VisitorsReportCharts,
      {
        report: data == null ? void 0 : data.visitorsReport,
        isLoading
      }
    )
  ] });
}
export {
  AdminReportPage as default
};
//# sourceMappingURL=admin-report-page-0ab8c4a9.mjs.map
