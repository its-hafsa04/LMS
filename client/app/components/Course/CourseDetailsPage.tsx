"use client";

import { useGetCourseDetailsQuery } from "@/redux/features/courses/coursesApi";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import Footer from "../Footer/Footer";
import Loader from "../Loader/Loader";
import {
  useCreatePaymentIntentMutation,
  useGetStripePublishableKeyQuery,
} from "@/redux/features/order/orderApi";
import CourseDetails from "./CourseDetails";
import Header from "../Header";
import Heading from "../../utils/Heading";

type Props = {
  id: string;
};

const CourseDetailsPage = ({ id }: Props) => {
  const [route, setRoute] = useState("Login");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetCourseDetailsQuery(id);
  const { data: config } = useGetStripePublishableKeyQuery({});
  const [createPaymentIntent, { data: paymentIntentData }] =
    useCreatePaymentIntentMutation();
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState("");

  const handlePayment = async (course) => {
    if (!course || !course._id) {
      console.error("Payment aborted: invalid course data", course);
      return;
    }

    try {
      const body = {
        courseId: course._id,
        // include additional server-expected fields if needed (amount, priceId, etc.)
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI || "http://localhost:8000/api/v1"}/payment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => null);
        console.error("Payment request failed:", res.status, errBody);
        // show user-friendly message or toast here
        return;
      }

      const data = await res.json();
      // Continue with Stripe redirection or client-side flow using returned data
      // e.g. stripe.redirectToCheckout({ sessionId: data.sessionId })
    } catch (err) {
      console.error("Payment error", err);
    }
  };

  useEffect(() => {
    if (config) {
      const publishableKey = config?.publishableKey;
      setStripePromise(loadStripe(publishableKey));
    }

    if (data) {
      const amount = Math.round(data.course.price * 100);
      createPaymentIntent(amount);
    }
  }, [config, createPaymentIntent, data]);

  useEffect(() => {
    if (paymentIntentData) {
      setClientSecret(paymentIntentData?.client_secret);
    }
    // console.log("🚀 ~ useEffect ~ paymentIntentData:", paymentIntentData)
  }, [paymentIntentData]);

  useEffect(() => {
    // stripe init code...
    // ensure loadStripe is only called client-side and we handle HTTP warning in dev
    (async () => {
      try {
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY;
        if (!stripeKey) return;
        await loadStripe(stripeKey);
      } catch (e) {
        console.warn(
          "Stripe init error (dev HTTP warning expected on localhost):",
          e
        );
      }
    })();
  }, []);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <Heading
            title={`${data.course.name + " - ELearning"}`}
            description="ELearning is a platform for students to learn and get help from teachers"
            keywords={data?.course?.tags}
          />
          <Header
            route={route}
            setRoute={setRoute}
            open={open}
            setOpen={setOpen}
            activeItem={1}
          />
          {stripePromise && (
            <CourseDetails
              data={data.course}
              stripePromise={stripePromise}
              clientSecret={clientSecret}
              setRoute={setRoute}
              setOpen={setOpen}
            />
          )}
          <Footer />
        </div>
      )}
    </>
  );
};

export default CourseDetailsPage;
