"use client";

import React from "react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-purple-600 to-indigo-700 text-white">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-10"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block mb-4 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
            >
              Công nghệ hỗ trợ người khiếm thị
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Gậy Thông Minh Cho Người Mù
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-purple-100 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Hệ thống hỗ trợ di chuyển thông minh cho người khiếm thị
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
