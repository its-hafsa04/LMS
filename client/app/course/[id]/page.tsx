"use client";
import CourseDetailsPage from "@/app/components/Course/CourseDetailsPage";
import React from "react";

const page = ({ params }: any) => {
  return (
    <div className="">
      <CourseDetailsPage id={params.id} />
    </div>
  );
};

export default page;
