import * as dashboardService from "../../services/dashboard.service.js";

// GET /admin/dashboard/overview
export async function getDashboardOverview(req, res, next) {
  try {
    const dashboardOverview = await dashboardService.GetDashboardOverview();

    return res.json({
      success: true,
      message: "Get admin dashboard successfully",
      data: dashboardOverview.data,
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/dashboard/stats/views
export async function getDashboardViewInRange(req, res, next) {
  try {
    let { fromDate, toDate, groupBy, storyId, storyNodeId } = req.query;

    const viewByDate = await dashboardService.GetDashboardViews({
      storyId: storyId,
      storyNodeId: storyNodeId,
      fromDate: fromDate,
      toDate: toDate,
      groupBy: groupBy,
    });

    return res.json({ success: true, data: viewByDate.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/dashboard/stats/new-users
export async function getDashboardNewUsers(req, res, next) {
  try {
    let { fromDate, toDate, groupBy } = req.query;

    if (!fromDate && !toDate) {
      toDate = new Date();

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }

    const newUsersByDate = dashboardService.GetDashboardNewUsers({ fromDate, toDate, groupBy: groupBy });

    return res.json({ success: true, data: (await newUsersByDate).data });
  } catch (error) {
    next(error);
  }
}
