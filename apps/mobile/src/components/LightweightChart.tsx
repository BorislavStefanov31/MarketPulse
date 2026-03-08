import { useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type DataPoint = { time: number; value: number };

type Props = {
  data: DataPoint[];
  width: number;
  height: number;
  lineColor?: string;
  areaTopColor?: string;
  areaBottomColor?: string;
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
};

export default function LightweightChart({
  data,
  width,
  height,
  lineColor = "#2962FF",
  areaTopColor = "rgba(41,98,255,0.28)",
  areaBottomColor = "rgba(41,98,255,0.02)",
  backgroundColor = "#ffffff",
  textColor = "#333",
  gridColor = "#eee",
}: Props) {
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${backgroundColor}; overflow: hidden; }
    #chart { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"><\/script>
  <script>
    const chart = LightweightCharts.createChart(document.getElementById('chart'), {
      width: ${width},
      height: ${height},
      layout: {
        background: { type: 'solid', color: '${backgroundColor}' },
        textColor: '${textColor}',
      },
      grid: {
        vertLines: { color: '${gridColor}' },
        horzLines: { color: '${gridColor}' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { pinch: true, axisPressedMouseMove: false },
    });

    const series = chart.addAreaSeries({
      lineColor: '${lineColor}',
      topColor: '${areaTopColor}',
      bottomColor: '${areaBottomColor}',
      lineWidth: 2,
    });

    series.setData(${JSON.stringify(data)});
    chart.timeScale().fitContent();
  <\/script>
</body>
</html>
`,
    [data, width, height, lineColor, areaTopColor, areaBottomColor, backgroundColor, textColor, gridColor],
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={{ width, height, backgroundColor: "transparent" }}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", borderRadius: 8 },
});
