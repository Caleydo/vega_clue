import {Spec} from 'vega-lib';

import AirportConnections from './airport-connections.vg.json';
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
import ZoomableWorldMap from './zoomable-world-map.vg.json';

export interface IVegaSpecDataset {
  title: string,
  spec: Spec
}

const vegaSpecs: IVegaSpecDataset[] = [
  {title: 'Global Development', spec: GlobalDevelopment},
  {title: 'Airport Connections', spec: AirportConnections},
  {title: 'Annual Temperature', spec: AnnualTemperature},
  {title: 'Arc Diagram', spec: ArcDiagram},
  {title: 'Area Chart', spec: AreaChart},
  {title: 'Bar Chart', spec: BarChart},
  {title: 'Barley Trellis Plot', spec: BarleyTrellisPlot},
  {title: 'Beeswarm Plot', spec: BeeswarmPlot},
  {title: 'Binned Scatter Plot', spec: BinnedScatterPlot},
  {title: 'Box Plot', spec: BoxPlot},
  {title: 'Brushing Scatter Plots', spec: BrushingScatterPlots},
  {title: 'Budget Forecasts', spec: BudgetForecasts},
  {title: 'Circle Packing', spec: CirclePacking},
  {title: 'Connected Scatter Plot', spec: ConnectedScatterPlot},
  {title: 'Contour Plot', spec: ContourPlot},
  {title: 'County Unemployment', spec: CountyUnemployment},
  {title: 'Crossfilter Flights', spec: CrossfilterFlights},
  {title: 'Distortion Comparison', spec: DistortionComparison},
  {title: 'Donut Chart', spec: DonutChart},
  {title: 'Dorling Cartogram', spec: DorlingCartogram},
  {title: 'Earthquakes', spec: Earthquakes},
  {title: 'Edge Bundling', spec: EdgeBundling},
  {title: 'Error Bars', spec: ErrorBars},
  {title: 'Falkensee Population', spec: FalkenseePopulation},
  {title: 'Force Directed Layout', spec: ForceDirectedLayout},
  {title: 'Grouped Bar Chart', spec: GroupedBarChart},
  {title: 'Heatmap', spec: Heatmap},
  {title: 'Histogram Null Values', spec: HistogramNullValues},
  {title: 'Histogram', spec: Histogram},
  {title: 'Horizon Graph', spec: HorizonGraph},
  {title: 'Interactive Legend', spec: InteractiveLegend},
  {title: 'Job Voyager', spec: JobVoyager},
  {title: 'Line Chart', spec: LineChart},
  {title: 'Nested Bar Chart', spec: NestedBarChart},
  {title: 'Overview Plus Detail', spec: OverviewPlusDetail},
  {title: 'Parallel Coordinates', spec: ParallelCoordinates},
  {title: 'Pie Chart', spec: PieChart},
  {title: 'Population Pyramid', spec: PopulationPyramid},
  {title: 'Probability Density', spec: ProbabilityDensity},
  {title: 'Projections', spec: Projections},
  {title: 'Radial Plot', spec: RadialPlot},
  {title: 'Radial Tree Layout', spec: RadialTreeLayout},
  {title: 'Reorderable Matrix', spec: ReorderableMatrix},
  {title: 'Scatter Plot Null Values', spec: ScatterPlotNullValues},
  {title: 'Scatter Plot', spec: ScatterPlot},
  {title: 'Stacked Area Chart', spec: StackedAreaChart},
  {title: 'Stacked Bar Chart', spec: StackedBarChart},
  {title: 'Stock Index Chart', spec: StockIndexChart},
  {title: 'Sunburst', spec: Sunburst},
  {title: 'Timelines', spec: Timelines},
  {title: 'Top K Plot With Others', spec: TopKPlotWithOthers},
  {title: 'Top K Plot', spec: TopKPlot},
  {title: 'Tree Layout', spec: TreeLayout},
  {title: 'Treemap', spec: Treemap},
  {title: 'U District Cuisine', spec: UDistrictCuisine},
  {title: 'Violin Plot', spec: ViolinPlot},
  {title: 'Weekly Temperature', spec: WeeklyTemperature},
  {title: 'Wheat And Wages', spec: WheatAndWages},
  {title: 'Wheat Plot', spec: WheatPlot},
  {title: 'Word Cloud', spec: WordCloud},
  {title: 'World Map', spec: WorldMap},
  {title: 'Zoomable Scatter Plot', spec: ZoomableScatterPlot},
  {title: 'Zoomable World Map', spec: ZoomableWorldMap},
];

export default vegaSpecs;
