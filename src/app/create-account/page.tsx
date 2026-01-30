"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Info } from "lucide-react";

export default function CreateAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/create-account/continue");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with logo */}
      <div className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-black text-lg">Soradin</span>
        </Link>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 pt-16">
        <h1 className="text-3xl font-normal text-gray-900 mb-8">
          Create an account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="flex items-center gap-1 text-sm text-gray-700 mb-2"
              >
                Legal first name
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="flex items-center gap-1 text-sm text-gray-700 mb-2"
              >
                Legal last name
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date of birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm text-gray-700 mb-2"
            >
              Date of birth
            </label>
            <div className="relative">
              <input
                type="text"
                id="dateOfBirth"
                name="dateOfBirth"
                placeholder="mm/dd/yyyy"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Sex */}
          <div>
            <label className="flex items-center gap-1 text-sm text-gray-700 mb-3">
              Sex
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="male"
                  checked={formData.sex === "male"}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-2 border-gray-300 bg-white checked:bg-white checked:border-yellow-400 checked:ring-2 checked:ring-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                />
                <span className="text-sm text-gray-700">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="female"
                  checked={formData.sex === "female"}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-2 border-gray-300 bg-white checked:bg-white checked:border-yellow-400 checked:ring-2 checked:ring-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                />
                <span className="text-sm text-gray-700">Female</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="other"
                  checked={formData.sex === "other"}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-2 border-gray-300 bg-white checked:bg-white checked:border-yellow-400 checked:ring-2 checked:ring-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                />
                <span className="text-sm text-gray-700">Other</span>
              </label>
            </div>
          </div>

          {/* Continue button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Continue
          </button>

          {/* Log in link */}
          <div className="text-center text-sm text-gray-700">
            Already have an account?{" "}
            <Link
              href="/agent"
              className="text-black underline hover:text-gray-700"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
