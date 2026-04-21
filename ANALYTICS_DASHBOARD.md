# Advanced Analytics Dashboard & Report Export

## Overview

The FeedSolve Analytics Dashboard provides comprehensive insights into submission metrics, team performance, and trends. It includes advanced visualization tools, date range filtering, and multiple export options (PDF and CSV).

## Key Features

### 1. **Analytics Metrics**
- **Resolution Rate**: Percentage of resolved submissions out of total
- **Average Resolution Time**: Mean time from submission to resolution (in days)
- **Submissions by Status**: Visual breakdown of submissions by status (received, in_review, in_progress, resolved, closed)
- **Submissions by Priority**: Count and percentage of submissions by priority level
- **Submissions by Category**: Distribution of submissions across categories
- **Team Member Performance**: Individual metrics for each team member
- **Submissions by Source**: Breakdown by board/QR code source
- **Trend Line**: Historical submission trends over selected time period

### 2. **Components**

#### **MetricCard** (`src/components/Analytics/MetricCard.tsx`)
Individual KPI display with optional trend indicators.
- Shows label, value, and unit
- Supports trend direction (up, down, neutral)
- Color-coded by metric type (primary, success, warning, error, accent)
- Optional icon support

```typescript
<MetricCard
  label="Resolution Rate"
  value={92.5}
  unit="%"
  color="success"
  trend={{ direction: 'up', percentage: 5.2 }}
/>
```

#### **TrendChart** (`src/components/Analytics/TrendChart.tsx`)
Line chart showing submission trends over time.
- Date range picker with presets (7, 30, 90 days, custom)
- Displays both total submissions and resolved count
- Interactive tooltips and legends
- Responsive design

#### **PerformanceTable** (`src/components/Analytics/PerformanceTable.tsx`)
Team member statistics and performance metrics.
- Assigned count, resolved count, resolution rate
- Average resolution time per team member
- Bar chart visualization
- Average priority handling

#### **StatusChart** (`src/components/Analytics/StatusChart.tsx`)
Pie chart for submissions by status.
- Color-coded by status type
- Shows count and percentage
- Interactive legend

#### **PriorityChart** (`src/components/Analytics/PriorityChart.tsx`)
Bar chart for submissions by priority.
- Ordered by priority level (critical → low)
- Color-coded bars
- Responsive layout

#### **CategoryChart** (`src/components/Analytics/CategoryChart.tsx`)
Horizontal bar chart for top submission categories.
- Top 10 categories by default
- Sortable by submission count
- Interactive hover effects

#### **SourceChart** (`src/components/Analytics/SourceChart.tsx`)
Breakdown of submissions by board/QR source.
- Table display with submission counts
- Percentage distribution
- Board name mapping

#### **ReportBuilder** (`src/components/Analytics/ReportBuilder.tsx`)
Custom report generation interface.
- Checkbox selection for metrics to include
- One-click PDF export
- CSV export for submissions
- Loading states

#### **FilterPanel** (`src/components/Analytics/FilterPanel.tsx`)
Multi-dimensional filtering for analytics data.
- Filter by boards, categories, status, priority
- Collapsible interface
- Clear all filters option
- Active filter count indicator

### 3. **Date Range Filtering**

**Utilities** (`src/lib/date-ranges.ts`)
```typescript
type DateRangePreset = '7days' | '30days' | '90days' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
  preset?: DateRangePreset;
}
```

**Presets**:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range

All date ranges use full-day boundaries (start of day to end of day).

### 4. **Analytics Calculations**

**Main Module** (`src/lib/analytics.ts`)

```typescript
function calculateAnalytics(
  submissions: Submission[],
  dateRange: DateRange
): AnalyticsMetrics
```

Returns comprehensive metrics object including:
- Total submissions and resolved count
- Resolution rate percentage
- Average resolution time
- Breakdown by status, priority, category, board
- Team performance metrics
- Trend data points
- Source distribution

### 5. **Export Functionality**

#### **PDF Reports** (`src/lib/export-report.ts`)
```typescript
async function downloadPDFReport(
  metrics: AnalyticsMetrics,
  dateRange: DateRange,
  companyName: string
): Promise<void>
```

PDF includes:
- Key metrics summary
- Date range information
- Status breakdown table
- Priority breakdown table
- Category breakdown table
- Team performance table
- Professional formatting with headers and footers

#### **CSV Export**
```typescript
function downloadCSV(submissions: Submission[]): void
```

CSV includes columns:
- Tracking Code
- Subject
- Category
- Status
- Priority
- Assigned To
- Created At
- Resolved At
- Resolution Time (days)

## Usage

### Basic Integration

```typescript
import { AnalyticsDashboard } from './pages/Analytics/AnalyticsDashboard';

// In your routing
<Route path="/analytics" element={<AnalyticsDashboard />} />
```

### Advanced Usage with Filters

```typescript
import { FilterPanel, type AnalyticsFilters } from './components/Analytics/FilterPanel';
import { calculateAnalytics } from './lib/analytics';

// Apply filters to analytics
const filteredSubmissions = applyFilters(submissions, filters);
const metrics = calculateAnalytics(filteredSubmissions, dateRange);
```

## Cloud Functions

### Analytics Scheduler

**File**: `functions/src/analytics-scheduler.ts`

#### `computeAnalyticsSnapshots()`
- **Trigger**: Daily (every 24 hours at UTC midnight)
- **Purpose**: Pre-compute and store analytics snapshots
- **Storage**: `companies/{companyId}/analyticsSnapshots/{date}`

```typescript
// Stored snapshot structure
{
  totalSubmissions: number;
  resolvedSubmissions: number;
  resolutionRate: number;
  averageResolutionTime: number;
  submissionsByStatus: Record<string, number>;
  submissionsByPriority: Record<string, number>;
  submissionsByCategory: Record<string, number>;
  submissionsByBoard: Record<string, number>;
  date: Date;
  createdAt: Date;
}
```

#### `getAnalyticsSnapshot()`
- **Trigger**: HTTPS callable
- **Purpose**: Retrieve pre-computed snapshot for specific date
- **Auth**: Required (authenticated user only)

### Deployment

```bash
# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log
```

## Firestore Indexes

Add these composite indexes for optimal performance:

### Required Indexes

**Index 1**: Analytics Snapshots by Company
- Collection: `analyticsSnapshots`
- Fields: `companyId` (Asc), `date` (Desc)

**Index 2**: Submissions by Company and Status
- Collection: `submissions`
- Fields: `companyId` (Asc), `status` (Asc), `resolvedAt` (Desc)

See `FIRESTORE_INDEXES.md` for complete index configuration.

## Performance Considerations

### Optimization Strategies

1. **Pre-computed Snapshots**: Daily Cloud Function pre-computes metrics
2. **Client-side Caching**: Store last analytics result in state
3. **Pagination**: Limit submissions query to 500 by default
4. **Index Usage**: Composite indexes for filtered queries
5. **Lazy Loading**: Charts only render when data is available

### Database Read Optimization

- Single company submissions fetch: 1 read
- Board list fetch: 1 read
- Total for dashboard: ~2 reads per page load

## Styling & Theming

All components use Tailwind CSS with FeedSolve's color system:
- `color-primary`: Blue (#3b82f6)
- `color-success`: Green (#10b981)
- `color-warning`: Yellow/Orange
- `color-error`: Red (#ef4444)
- `color-accent`: Cyan

## Dependencies

```json
{
  "recharts": "^3.8.1",
  "jspdf": "^2.5.1",
  "lucide-react": "^1.8.0",
  "date-fns": "^3.6.0"
}
```

## Type Definitions

### AnalyticsMetrics
```typescript
interface AnalyticsMetrics {
  totalSubmissions: number;
  resolvedSubmissions: number;
  resolutionRate: number;
  averageResolutionTime: number;
  submissionsByStatus: Record<string, number>;
  submissionsByPriority: Record<string, number>;
  submissionsByCategory: Record<string, number>;
  submissionsByBoard: Record<string, number>;
  teamPerformance: TeamPerformanceMetric[];
  trendData: TrendDataPoint[];
  submissionsBySource: Record<string, number>;
}
```

### TeamPerformanceMetric
```typescript
interface TeamPerformanceMetric {
  userId: string;
  userName: string;
  userEmail: string;
  assignedCount: number;
  resolvedCount: number;
  resolutionRate: number;
  averageResolutionTime: number;
  averagePriority: string;
}
```

### TrendDataPoint
```typescript
interface TrendDataPoint {
  date: string; // ISO date
  count: number; // submissions on that day
  resolved: number; // resolved on that day
}
```

## Testing

### Key Scenarios to Test

1. **Date Range Selection**
   - Test each preset (7, 30, 90 days)
   - Test custom date range
   - Verify data updates correctly

2. **Filtering**
   - Filter by single board/category
   - Filter by multiple options
   - Clear all filters

3. **Export Functionality**
   - Generate PDF with all metrics
   - Download CSV submissions
   - Verify file names and content

4. **Performance**
   - Load time with 1000+ submissions
   - Chart rendering performance
   - Memory usage

## Future Enhancements

1. **Advanced Analytics**
   - SLA tracking
   - Customer satisfaction scores
   - Seasonal trend analysis
   - Predictive analytics

2. **Reporting**
   - Scheduled report emails
   - Custom report builder with drag-drop
   - Benchmark comparisons

3. **Optimization**
   - Real-time metric updates
   - Analytics caching layer
   - Data export to third-party platforms

4. **Visualization**
   - More chart types (scatter, heatmap)
   - Interactive dashboards
   - Custom theme colors
   - Data drill-down capabilities

## Troubleshooting

### Charts Not Rendering
- Check if data array is empty
- Verify date range has submissions
- Check browser console for errors

### Export Failures
- Verify file permissions
- Check popup blocker settings
- Ensure sufficient memory for large CSVs

### Performance Issues
- Create required Firestore indexes
- Reduce date range to smaller period
- Clear browser cache
- Check network connection speed

## Support

For issues or questions about the analytics dashboard, refer to:
- `src/lib/analytics.ts` - Core calculation logic
- `src/components/Analytics/` - UI component implementations
- `functions/src/analytics-scheduler.ts` - Cloud function logic

## Changelog

### v1.0.0
- Initial release with core analytics features
- 8 visualization components
- PDF and CSV export
- Daily snapshot Cloud Function
- Multi-dimensional filtering
