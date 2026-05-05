"use client";
import AdminSidebar from "@/app/components/Admin/Sidebar/AdminSidebar";
import PageHead from "@/app/components/Common/PageHead";
import UserAnalytics from "@/app/components/Admin/Analytics/UserAnalytics";
import DashboardHeader from "@/app/components/Admin/DashboardHeader";
import AdminProtected from "@/app/hooks/adminProtected";
const Page = () => {
  return (
    <div>
      <AdminProtected>
        <PageHead
           title="Abous us - ELearning"
        description="ELearning is an interactive E-Learning platform where all students can learn and grow together"
        keywords="Online Learning, Learning, LMS, Programming, Tech"
        />
        <div className="flex">
          <div className="1500px:w-[16px] w-1/5">
            <AdminSidebar />
          </div>
          <div className="w-[85%] ">
            <DashboardHeader />
            {/* <CreateCourse /> */}
            <UserAnalytics />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};

export default Page;

