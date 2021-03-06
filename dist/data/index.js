/*import AirportConnections from './airport-connections.vg.json';
import AnnualTemperature from './annual-temperature.vg.json';
import ArcDiagram from './arc-diagram.vg.json';
import AreaChart from './area-chart.vg.json';
import BarChart from './bar-chart.vg.json';
import BarleyTrellisPlot from './barley-trellis-plot.vg.json';
import BeeswarmPlot from './beeswarm-plot.vg.json';
import BinnedScatterPlot from './binned-scatter-plot.vg.json';
import BoxPlot from './box-plot.vg.json';
import BrushingScatterPlots from './brushing-scatter-plots.vg.json';
import BudgetForecasts from './budget-forecasts.vg.json';
import CirclePacking from './circle-packing.vg.json';
import ConnectedScatterPlot from './connected-scatter-plot.vg.json';
import ContourPlot from './contour-plot.vg.json';
import CountyUnemployment from './county-unemployment.vg.json';
import CrossfilterFlights from './crossfilter-flights.vg.json';
import DistortionComparison from './distortion-comparison.vg.json';
import DonutChart from './donut-chart.vg.json';
import DorlingCartogram from './dorling-cartogram.vg.json';
import Earthquakes from './earthquakes.vg.json';
import EdgeBundling from './edge-bundling.vg.json';
import ErrorBars from './error-bars.vg.json';
import FalkenseePopulation from './falkensee-population.vg.json';
import ForceDirectedLayout from './force-directed-layout.vg.json';
import GlobalDevelopment from './global-development.vg.json';
import GroupedBarChart from './grouped-bar-chart.vg.json';
import Heatmap from './heatmap.vg.json';
import HistogramNullValues from './histogram-null-values.vg.json';
import Histogram from './histogram.vg.json';
import HorizonGraph from './horizon-graph.vg.json';
import InteractiveLegend from './interactive-legend.vg.json';
import JobVoyager from './job-voyager.vg.json';
import LineChart from './line-chart.vg.json';
import NestedBarChart from './nested-bar-chart.vg.json';
import OverviewPlusDetail from './overview-plus-detail.vg.json';
import ParallelCoordinates from './parallel-coordinates.vg.json';
import PieChart from './pie-chart.vg.json';
import PopulationPyramid from './population-pyramid.vg.json';
import ProbabilityDensity from './probability-density.vg.json';
import Projections from './projections.vg.json';
import RadialPlot from './radial-plot.vg.json';
import RadialTreeLayout from './radial-tree-layout.vg.json';
import ReorderableMatrix from './reorderable-matrix.vg.json';
import ScatterPlotNullValues from './scatter-plot-null-values.vg.json';
import ScatterPlot from './scatter-plot.vg.json';
import StackedAreaChart from './stacked-area-chart.vg.json';
import StackedBarChart from './stacked-bar-chart.vg.json';
import StockIndexChart from './stock-index-chart.vg.json';
import Sunburst from './sunburst.vg.json';
import Timelines from './timelines.vg.json';
import TopKPlotWithOthers from './top-k-plot-with-others.vg.json';
import TopKPlot from './top-k-plot.vg.json';
import TreeLayout from './tree-layout.vg.json';
import Treemap from './treemap.vg.json';
import UDistrictCuisine from './u-district-cuisine.vg.json';
import ViolinPlot from './violin-plot.vg.json';
import WeeklyTemperature from './weekly-temperature.vg.json';
import WheatAndWages from './wheat-and-wages.vg.json';
import WheatPlot from './wheat-plot.vg.json';
import WordCloud from './word-cloud.vg.json';
import WorldMap from './world-map.vg.json';
import ZoomableScatterPlot from './zoomable-scatter-plot.vg.json';
import ZoomableWorldMap from './zoomable-world-map.vg.json';*/
import { tsv } from 'd3';
// Prefixing with ! will disable all configured normal loaders
import csvGdp from '!file-loader!./gapminder/gdp.txt';
import csvChildMortality from '!file-loader!./gapminder/childmortality.txt';
import csvContinent from '!file-loader!./gapminder/continent.txt';
import csvFertility from '!file-loader!./gapminder/fertility.txt';
import csvLifetimeExpectancy from '!file-loader!./gapminder/lifeexpectancy.txt';
import csvReligions from '!file-loader!./gapminder/main_religions.txt';
import csvPopulation from '!file-loader!./gapminder/totalPop_interpolated.txt';
import tsvWorldCountryNames from '!file-loader!./gapminder/world-country-names.tsv';
import Gapminder from './gapminder/gapminder.vg.json';
function loadTsvData(dataset, filterFnc = (entry) => entry[0] !== 'country') {
    return new Promise((resolve) => {
        tsv(dataset, (rawRow) => {
            return Object.entries(rawRow).filter(filterFnc);
        }, (_error, data) => {
            resolve(data);
        });
    });
}
const gapminderData = Promise.all([
    loadTsvData(csvGdp, (entry) => entry[0] === 'country'),
    loadTsvData(csvGdp),
    loadTsvData(csvChildMortality),
    loadTsvData(csvContinent),
    loadTsvData(csvFertility),
    loadTsvData(csvLifetimeExpectancy),
    loadTsvData(csvReligions),
    loadTsvData(csvPopulation),
    loadTsvData(tsvWorldCountryNames)
]).then((csv) => {
    const [country, gdp, childMortality, continent, fertility, lifetimeExpectancy, religions, population, worldCountryNames] = [...csv];
    const data = [];
    country.forEach((d, i) => {
        gdp[i].forEach((e, j) => {
            const countryName = worldCountryNames.filter((f) => f[1][1] === country[i][0][1])[0];
            const mapId = (countryName) ? +countryName[0][1] : 0;
            const r = {
                country: country[i][0][1],
                year: +gdp[i][j][0],
                map_id: +mapId,
                continent: continent[i][0][1],
                main_religion: religions[i][0][1],
                gdp: +gdp[i][j][1],
                child_mortality: +childMortality[i][j][1],
                fertility: +fertility[i][j][1],
                life_expect: +lifetimeExpectancy[i][j][1],
                population: +population[i][j][1],
            };
            data.push(r);
        });
    });
    return data;
});
var ECategories;
(function (ECategories) {
    /*BAR_CHARTS = 'Bar Charts',
    LINE_CHARTS = 'Line & Area Charts',
    CIRCULAR_CHARTS = 'Circular Charts',
    SCATTER_PLOTS = 'Dot & Scatter Plots',
    DISTRIBUTIONS = 'Distributions',
    MAPS = 'Geographic Maps',
    TREE_DIAGRAMS = 'Tree Diagrams',
    NETWORK_DIAGRAMS = 'Network Diagrams',
    OTHER_CHARTS = 'Other Chart Types',
    CUSTOM_VISUAL_DESIGNS = 'Custom Visual Designs',*/
    ECategories["INTERACTION_TECHNIQUES"] = "Interaction Techniques";
})(ECategories || (ECategories = {}));
const vegaSpecs = [
/*{title: 'Airport Connections', spec: AirportConnections, category: ECategories.NETWORK_DIAGRAMS},
{title: 'Annual Temperature', spec: AnnualTemperature, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Arc Diagram', spec: ArcDiagram, category: ECategories.NETWORK_DIAGRAMS},
{title: 'Area Chart', spec: AreaChart, category: ECategories.LINE_CHARTS},
{title: 'Bar Chart', spec: BarChart, category: ECategories.BAR_CHARTS},
{title: 'Barley Trellis Plot', spec: BarleyTrellisPlot, category: ECategories.SCATTER_PLOTS},
{title: 'Beeswarm Plot', spec: BeeswarmPlot, category: ECategories.OTHER_CHARTS},
{title: 'Binned Scatter Plot', spec: BinnedScatterPlot, category: ECategories.DISTRIBUTIONS},
{title: 'Box Plot', spec: BoxPlot, category: ECategories.DISTRIBUTIONS},
{title: 'Brushing Scatter Plots', spec: BrushingScatterPlots, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Budget Forecasts', spec: BudgetForecasts, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Circle Packing', spec: CirclePacking, category: ECategories.TREE_DIAGRAMS},
{title: 'Connected Scatter Plot', spec: ConnectedScatterPlot, category: ECategories.SCATTER_PLOTS},
{title: 'Contour Plot', spec: ContourPlot, category: ECategories.DISTRIBUTIONS},
{title: 'County Unemployment', spec: CountyUnemployment, category: ECategories.MAPS},
{title: 'Crossfilter Flights', spec: CrossfilterFlights, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Distortion Comparison', spec: DistortionComparison, category: ECategories.MAPS},
{title: 'Donut Chart', spec: DonutChart, category: ECategories.CIRCULAR_CHARTS},
{title: 'Dorling Cartogram', spec: DorlingCartogram, category: ECategories.MAPS},
{title: 'Earthquakes', spec: Earthquakes, category: ECategories.MAPS},
{title: 'Edge Bundling', spec: EdgeBundling, category: ECategories.NETWORK_DIAGRAMS},
{title: 'Error Bars', spec: ErrorBars, category: ECategories.SCATTER_PLOTS},
{title: 'Falkensee Population', spec: FalkenseePopulation, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Force Directed Layout', spec: ForceDirectedLayout, category: ECategories.NETWORK_DIAGRAMS},
{title: 'Global Development', spec: GlobalDevelopment, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Grouped Bar Chart', spec: GroupedBarChart, category: ECategories.BAR_CHARTS},
{title: 'Heatmap', spec: Heatmap, category: ECategories.OTHER_CHARTS},
{title: 'Histogram Null Values', spec: HistogramNullValues, category: ECategories.DISTRIBUTIONS},
{title: 'Histogram', spec: Histogram, category: ECategories.DISTRIBUTIONS},
{title: 'Horizon Graph', spec: HorizonGraph, category: ECategories.LINE_CHARTS},
{title: 'Interactive Legend', spec: InteractiveLegend, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Job Voyager', spec: JobVoyager, category: ECategories.LINE_CHARTS},
{title: 'Line Chart', spec: LineChart, category: ECategories.LINE_CHARTS},
{title: 'Nested Bar Chart', spec: NestedBarChart, category: ECategories.BAR_CHARTS},
{title: 'Overview Plus Detail', spec: OverviewPlusDetail, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Parallel Coordinates', spec: ParallelCoordinates, category: ECategories.OTHER_CHARTS},
{title: 'Pie Chart', spec: PieChart, category: ECategories.CIRCULAR_CHARTS},
{title: 'Population Pyramid', spec: PopulationPyramid, category: ECategories.BAR_CHARTS},
{title: 'Probability Density', spec: ProbabilityDensity, category: ECategories.DISTRIBUTIONS},
{title: 'Projections', spec: Projections, category: ECategories.MAPS},
{title: 'Radial Plot', spec: RadialPlot, category: ECategories.CIRCULAR_CHARTS},
{title: 'Radial Tree Layout', spec: RadialTreeLayout, category: ECategories.TREE_DIAGRAMS},
{title: 'Reorderable Matrix', spec: ReorderableMatrix, category: ECategories.NETWORK_DIAGRAMS},
{title: 'Scatter Plot Null Values', spec: ScatterPlotNullValues, category: ECategories.SCATTER_PLOTS},
{title: 'Scatter Plot', spec: ScatterPlot, category: ECategories.SCATTER_PLOTS},
{title: 'Stacked Area Chart', spec: StackedAreaChart, category: ECategories.LINE_CHARTS},
{title: 'Stacked Bar Chart', spec: StackedBarChart, category: ECategories.BAR_CHARTS},
{title: 'Stock Index Chart', spec: StockIndexChart, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Sunburst', spec: Sunburst, category: ECategories.TREE_DIAGRAMS},
{title: 'Timelines', spec: Timelines, category: ECategories.OTHER_CHARTS},
{title: 'Top K Plot With Others', spec: TopKPlotWithOthers, category: ECategories.DISTRIBUTIONS},
{title: 'Top K Plot', spec: TopKPlot, category: ECategories.DISTRIBUTIONS},
{title: 'Tree Layout', spec: TreeLayout, category: ECategories.TREE_DIAGRAMS},
{title: 'Treemap', spec: Treemap, category: ECategories.TREE_DIAGRAMS},
{title: 'U District Cuisine', spec: UDistrictCuisine, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Violin Plot', spec: ViolinPlot, category: ECategories.DISTRIBUTIONS},
{title: 'Weekly Temperature', spec: WeeklyTemperature, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Wheat And Wages', spec: WheatAndWages, category: ECategories.CUSTOM_VISUAL_DESIGNS},
{title: 'Wheat Plot', spec: WheatPlot, category: ECategories.DISTRIBUTIONS},
{title: 'Word Cloud', spec: WordCloud, category: ECategories.OTHER_CHARTS},
{title: 'World Map', spec: WorldMap, category: ECategories.MAPS},
{title: 'Zoomable Scatter Plot', spec: ZoomableScatterPlot, category: ECategories.INTERACTION_TECHNIQUES},
{title: 'Zoomable World Map', spec: ZoomableWorldMap, category: ECategories.MAPS},*/
];
export function loadDatasets() {
    return gapminderData
        .then((data) => {
        Gapminder.data.filter((d) => d.name === 'gapminder')[0].values = data;
        return {
            title: 'Gapminder',
            spec: Gapminder,
            category: ECategories.INTERACTION_TECHNIQUES
        };
    })
        .then((gapminder) => {
        return [gapminder, ...vegaSpecs];
    });
}
//# sourceMappingURL=index.js.map