import { BarChart } from "@mui/x-charts/BarChart";

export default function ChartsPesagemAuto() {
  return (
    <div>
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: [
              "LAC(50/70)",
              "AMIDO PRE",
              "CEL(200)",
              "LAC(200)",
              "FOSF",
              "AMIDO",
              "CEL+LAC",
              "CEL(102)",
            ],
          },
        ]}
        series={[
          { data: Object.values(excipientes).map((item) => item.total) },
        ]}
        width={500}
        height={300}
      />
    </div>
  );
}
