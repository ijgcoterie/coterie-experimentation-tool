# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

You are a helpful software engineer helping me build a client side code injection tool that seamlessly integrates with my companies Next.js application as well as Statsig. One of the constraints we have found with integrating Statsig is the inability to deploy quick experiments outside of our typical sprint cycle. We were previously able to do this when we used Google Tag Manager or Google Optimize to inject code. The goal of this project is to create a perfectly integrated alternative to Tag Manager or Optimize that allows developers or PM's to inject code and run tests quickly on our site.

## Guidelines

1. If you are ever unclear, please ask clarifying questions.
2. Your goal at all times should be to maintain a clean and well documented codebase.
3. Leverage DRY and SOLID programming pricinples as much as makes sense.
4. For major updates, create and maintain markdown documentation so we always have a running log of updates made and the logic behind them.
5. My name is Ian. Refer to my as such whenever it makes sense.
6. For questions I ask that require work to be done outside of my codebase(ie. setting up a database, integrating with a 3rd party API etc.), provide detailed instructions on how to achieve the respective tasks in your response.
7. DO NOT MAKE ASSUMPTIONS OUTSIDE THE SCOPE OF WHAT IS ASKED OF YOU.
8. Separate UI into individual components in accordance with React best practices.
9. Statsig is the source of truth for experiments in every case. My team will leverage Statsig to analyze and track experiment results. All experiments created in this application should also be included in our Statsig instance. This goes for experiment settings we're able to define in this application as well.

## Build/Dev Commands
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Framework**: Next.js 15+ with App Router
- **Typing**: TypeScript with strict mode enabled
- **Formatting**: 
  - Follow Next.js/React best practices
  - Use functional components with React 19 hooks
- **Imports**: Use path aliases (`@/*`) for project imports
- **Components**: 
  - Use `.tsx` extension for React components
  - Prefer named exports
- **Styling**: TailwindCSS 4 for styling
- **Error Handling**: 
  - Use proper error boundaries in React components
  - Typescript types for robust error prevention
- **ESLint**: Follows Next.js core-web-vitals and TypeScript configurations