"use client";

import StatsCard from "@/components/cards/admin/stats-card";
import LineChart from "@/components/chart/line-chart";
import Loading from "@/components/loadings/loading";
import SlidingUnderlineSelection from "@/components/selections/sliding-underline-selection";
import withAdmin from "@/hoc/withAdmin";

import GroupByIcon from "@/public/group-by.svg";

import adminService from "@/services/admin";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { subMonths, subWeeks, subYears } from "date-fns";
import FilterDate from "@/components/filters/filter-date";
import ButtonDropdownRadio from "@/components/buttons/dropdown/btn-drop-down-radio";
import { capitalizeWords } from "@/utils/string";
import PieChart from "@/components/chart/pie-chart";

const testValue = [
  { key: "fasd", value: 12 },
  { key: "dfa 231 2", value: 44 },
  { key: "xfgd   e", value: 13 },
  { key: "df sdszf", value: 32 },
  { key: "12 dsfs", value: 19 },
  { key: "xfgd   e", value: 13 },
  { key: "df sdszf", value: 6 },
  { key: "12 dsfs", value: 19 },
  { key: "xfgd   e", value: 53 },
];

const USER_PIE_CHART_COLORS = [
  "#405D5D",
  "#657979",
  "#7A8787",
  "#19394B",
  "#31576D",
  "#50758B",
  "#618499",
  "#7593A6",
  "#A0B1BC",
  "#2A4631",
  "#4D7657",
  "#5A8664",
  "#77A682",
  "#9BC6A4",
  "#C7E3CC",
  "#505441",
  "#5F6351",
  "#7E8075",
  "#8E8F89",
  "#A3A3A3",
  "#C4C4C4",
  "#CCD0D2",
];

const STORIES_PIE_CHART_COLORS = [
  "#6A4E42", // warm brown
  "#8B6A5E",
  "#A07F73",

  "#7A3E2E", // warm terracotta
  "#9A5A44",
  "#B5745A",
  "#C48A73",
  "#D4A28E",

  "#8F6B2E", // warm olive
  "#A8843E",
  "#B99A55",
  "#CDB57A",
  "#E2D0A6",

  "#6E5A3D", // warm khaki / sand
  "#827054",
  "#9B8A6E",
  "#B1A48D",

  "#8F877F", // warm gray
  "#A39C95",
  "#BDB6AF",
  "#D6D1CC",
  "#E1DDD8",
];

type DateRange = "1week" | "1month" | "3month" | "6month" | "1year" | "custom";
type GroupBy = "day" | "week" | "month" | "year";

const RANGES: { id: DateRange; value: string }[] = [
  { id: "1week", value: "1 tuần" },
  { id: "1month", value: "1 tháng" },
  { id: "3month", value: "3 tháng" },
  { id: "6month", value: "6 tháng" },
  { id: "1year", value: "1 năm" },
  { id: "custom", value: "Tùy chỉnh" },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<DashboardOverview>();

  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(subWeeks(new Date(), 1).toUTCString()));
  const [viewEndDate, setViewEndDate] = useState<Date>(new Date());
  const [statsView, setStatsView] = useState<{ key: string; value: number }[]>([]);
  const [viewGroupBy, setViewGroupBy] = useState<GroupBy>("day");
  const [viewStatsSelection, setViewStatsSelection] = useState<DateRange>("1week");

  const [newUsersStats, setNewUsersStats] = useState<{ key: string; value: number }[]>([]);
  const [newUsersStartDate, setNewUsersStartDate] = useState<Date>(new Date(subWeeks(new Date(), 1).toUTCString()));
  const [newUsersEndDate, setNewUsersEndDate] = useState<Date>(new Date());
  const [newUsersGroup, setNewUsersGroup] = useState<GroupBy>("day");
  const [newUsersDateRangeSelection, setNewUsersDateRangeSelection] = useState<DateRange>("1week");

  function handleSwitchRangeForStats({
    range,
    setStartDate,
    setEndDate,
    setGroup,
  }: {
    range: DateRange;
    setStartDate?: (date: Date) => void;
    setEndDate?: (date: Date) => void;
    setGroup?: (group: GroupBy) => void;
  }) {
    switch (range) {
      case "1week":
        setStartDate?.(new Date(subWeeks(new Date(), 1).toUTCString()));
        setGroup?.("day");
        break;
      case "1month":
        setStartDate?.(new Date(subMonths(new Date(), 1).toUTCString()));
        setGroup?.("day");
        break;
      case "3month":
        setStartDate?.(new Date(subMonths(new Date(), 3).toUTCString()));
        setGroup?.("week");
        break;
      case "6month":
        setStartDate?.(new Date(subMonths(new Date(), 6).toUTCString()));
        setGroup?.("month");
        break;
      case "1year":
        setStartDate?.(new Date(subYears(new Date(), 1).toUTCString()));
        setGroup?.("month");
        break;
    }

    setEndDate?.(new Date());
  }

  useEffect(() => {
    handleSwitchRangeForStats({
      range: viewStatsSelection,
      setStartDate: setViewStartDate,
      setEndDate: setViewEndDate,
      setGroup: setViewGroupBy,
    });
  }, [viewStatsSelection]);

  useEffect(() => {
    async function fetchStatsView() {
      const res = await adminService.getStatsView({ from: viewStartDate ?? new Date(), to: viewEndDate ?? new Date(), groupBy: viewGroupBy });

      if (!res.success) return toast.warning(res.message);

      const data = res.data ?? [];

      setStatsView(data.map((d) => ({ key: new Date(d.date).toLocaleDateString("vi"), value: d.view })));
    }

    fetchStatsView();
  }, [viewStartDate, viewEndDate, viewGroupBy]);

  useEffect(() => {
    handleSwitchRangeForStats({
      range: newUsersDateRangeSelection,
      setStartDate: setNewUsersStartDate,
      setEndDate: setNewUsersEndDate,
      setGroup: setNewUsersGroup,
    });
  }, [newUsersDateRangeSelection]);

  useEffect(() => {
    async function fetchStatsNewUsers() {
      const res = await adminService.getStatsNewUsers({ from: newUsersStartDate ?? new Date(), to: newUsersEndDate ?? new Date(), groupBy: newUsersGroup });

      if (!res.success) return toast.warning(res.message);

      const data = res.data ?? [];

      setNewUsersStats(data.map((d) => ({ key: new Date(d.date).toLocaleDateString("vi"), value: d.count })));
    }

    fetchStatsNewUsers();
  }, [newUsersStartDate, newUsersEndDate, newUsersGroup]);

  useEffect(() => {
    async function fetchOveriew() {
      setLoading(true);
      const res = await adminService.getOverview();
      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setOverview(res.data);
    }

    fetchOveriew();
  }, []);

  return (
    <div className="relative mt-5">
      {loading ? (
        <Loading className=" h-[80vh]"></Loading>
      ) : (
        <div className=" flex flex-col gap-8">
          {/* General info */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatsCard
              label="Stories"
              value={overview?.totalStories}
              subLabel={`${overview?.totalStoriesBaseOnStatus["ongoing"]} ongoing`}
              icon={<img src="book.png"></img>}
            ></StatsCard>

            <StatsCard
              label="Users"
              value={overview?.totalUsers}
              subLabel={`${overview?.totalBannedUsers} banned users`}
              icon={<img src="user.png"></img>}
            ></StatsCard>

            <StatsCard label="Views" value={overview?.totalView} icon={<img src="reading.png"></img>} subLabel={`${overview?.totalRating} ratings`}></StatsCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
            <div>
              <h2 className="w-full text-center">User</h2>
              <PieChart
                className="w-[400px] shrink-0 flex-wrap"
                values={Object.keys(overview?.totalUserBaseOnRole ?? []).map((value) => ({
                  key: capitalizeWords(value),
                  value: Number(overview?.totalUserBaseOnRole[value] ?? 0),
                }))}
                colorsSet={USER_PIE_CHART_COLORS}
                strokeWidth={15}
              ></PieChart>
            </div>

            <div>
              <h2 className="w-full text-center">Stories Status</h2>
              <PieChart
                className="w-[400px] shrink-0 flex-wrap"
                values={Object.keys(overview?.totalStoriesBaseOnStatus ?? []).map((value) => ({
                  key: capitalizeWords(value),
                  value: Number(overview?.totalStoriesBaseOnStatus[value] ?? 0),
                }))}
                colorsSet={STORIES_PIE_CHART_COLORS}
                strokeWidth={15}
              ></PieChart>
            </div>
          </div>

          {/* Stats view */}
          <div className=" rounded-md flex flex-col gap-px">
            <div className="flex flex-row flex-wrap justify-between ">
              <h2 className="mx-2">Views</h2>
              <div className="overflow-y-scroll no-scrollbar">
                <SlidingUnderlineSelection
                  className="w-fit"
                  labels={RANGES.map((range) => range.value)}
                  defaultSelection={0}
                  onSelected={(index) => setViewStatsSelection(RANGES?.at(index)?.id ?? "1week")}
                ></SlidingUnderlineSelection>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-2 ">
              {viewStatsSelection === "custom" && (
                <div className="flex flex-row gap-2 -mt-1">
                  <FilterDate
                    label="From:"
                    defaultValue={viewStartDate}
                    onChange={(date) => {
                      if (date > viewEndDate) return toast.warning("Ngày không hợp lệ");
                      setViewStartDate(date);
                    }}
                  ></FilterDate>
                  <FilterDate
                    label="To:"
                    defaultValue={viewEndDate}
                    onChange={(date) => {
                      if (date < viewStartDate) return toast.warning("Ngày không hợp lệ");
                      setViewEndDate(date);
                    }}
                  ></FilterDate>

                  <ButtonDropdownRadio
                    label={
                      <div className="flex flex-row gap-2 justify-center items-center">
                        <GroupByIcon className="w-4 h-4 fill-foreground"></GroupByIcon>
                        <p className="font-semibold">Nhóm: </p>
                        <p>{capitalizeWords(viewGroupBy)}</p>
                      </div>
                    }
                    options={[
                      { label: "Ngày", isChecked: viewGroupBy === "day", code: "day" },
                      { label: "Tháng", isChecked: viewGroupBy === "month", code: "month" },
                      { label: "Năm", isChecked: viewGroupBy === "year", code: "year" },
                    ]}
                    onFinishCheck={(selection) => setViewGroupBy(selection.find((s) => s.isChecked == true)?.code as GroupBy)}
                    name="groupBy"
                  ></ButtonDropdownRadio>
                </div>
              )}

              <LineChart value={statsView} unit="views" lineColor="#1f3eb6" className="h-[500px]"></LineChart>
            </div>
          </div>

          {/* Stats new users */}
          <div className=" rounded-md flex flex-col gap-px">
            <div className="flex flex-row flex-wrap justify-between ">
              <h2 className="mx-2">New Users</h2>
              <div className="overflow-y-scroll no-scrollbar">
                <SlidingUnderlineSelection
                  className="w-fit"
                  labels={RANGES.map((range) => range.value)}
                  defaultSelection={0}
                  onSelected={(index) => setNewUsersDateRangeSelection(RANGES?.at(index)?.id ?? "1week")}
                ></SlidingUnderlineSelection>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-2 ">
              {newUsersDateRangeSelection === "custom" && (
                <div className="flex flex-row gap-2 -mt-1">
                  <FilterDate
                    label="From:"
                    defaultValue={newUsersStartDate}
                    onChange={(date) => {
                      if (date > newUsersEndDate) return toast.warning("Ngày không hợp lệ");
                      setNewUsersStartDate(date);
                    }}
                  ></FilterDate>
                  <FilterDate
                    label="To:"
                    defaultValue={newUsersEndDate}
                    onChange={(date) => {
                      if (date < newUsersStartDate) return toast.warning("Ngày không hợp lệ");
                      setNewUsersEndDate(date);
                    }}
                  ></FilterDate>

                  <ButtonDropdownRadio
                    label={
                      <div className="flex flex-row gap-2 justify-center items-center">
                        <GroupByIcon className="w-4 h-4 fill-foreground"></GroupByIcon>
                        <p className="font-semibold">Nhóm: </p>
                        <p>{capitalizeWords(viewGroupBy)}</p>
                      </div>
                    }
                    options={[
                      { label: "Ngày", isChecked: viewGroupBy === "day", code: "day" },
                      { label: "Tháng", isChecked: viewGroupBy === "month", code: "month" },
                      { label: "Năm", isChecked: viewGroupBy === "year", code: "year" },
                    ]}
                    onFinishCheck={(selection) => setNewUsersGroup(selection.find((s) => s.isChecked == true)?.code as GroupBy)}
                    name="groupBy"
                  ></ButtonDropdownRadio>
                </div>
              )}

              <LineChart value={newUsersStats} unit="người" lineColor="#F41400" className="h-[500px]"></LineChart>
            </div>
          </div>

          <div className="w-full h-[50vh]"></div>
        </div>
      )}
    </div>
  );
}

// export default withAdmin(Dashboard);
