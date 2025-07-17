'use client';

import React, { memo, useEffect, useState } from "react";
import {
  FiBox as BoxIcon,
  FiBook as BookText,
  FiHome as Landmark,
  FiDollarSign as BadgeIndianRupee,
  FiUsers as Users,
  FiSettings as Settings,
  FiMonitor as MonitorCog,
  FiActivity as Gauge,
  FiCircle as Dot,
  FiChevronDown as ChevronDown,
  FiBookOpen,
} from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Heading, Image, Text, Wrap } from "@chakra-ui/react";
import { Button } from "@/app/_components/ui";

const Sidebar = () => {
  type NavTreeType = {
    title: string;
    url: string;
    icon?: React.ComponentType<any>;
    subMenu?: NavTreeType[];
  };

  const navTree: NavTreeType[] = [
    {
      title: "首页",
      url: "/admin",
      icon: Gauge,
    },
    {
      title: "banner管理",
      url: "/admin/banner",
      icon: FiBookOpen,
    },
    {
      title: "Business",
      url: "/business-entities",
      icon: Landmark,
      subMenu: [
        { title: "Companies", url: "/companies" },
        { title: "Members", url: "/members" },
        { title: "Partners", url: "/partners" },
        { title: "Inquiries", url: "/inquiries" },
        { title: "All Documents", url: "/all-documents" },
      ],
    },
    {
      title: "Product Management",
      url: "/product-management",
      icon: BoxIcon,
      subMenu: [
        { title: "Brands", url: "/brands" },
        { title: "Categories & Subcategories", url: "/categories" },
        { title: "Products", url: "/products" },
      ],
    },
    {
      title: "Sales & Marketing",
      url: "/sales-marketing",
      icon: BadgeIndianRupee,
      subMenu: [
        { title: "Wall Listings", url: "/wall-listing" },
        { title: "Opportunities", url: "/opportunities" },
        { title: "Offers & Demands", url: "/offers-demands" },
        { title: "Leads", url: "/leads" },
        { title: "Email Campaigns", url: "/email-campaign" },
        { title: "Automation Emails", url: "/automation-email" },
        { title: "Email Templates", url: "/email-templates" },
        { title: "Subscribers", url: "/subscribers" },
        { title: "Feedback / Requests", url: "/request-feedback" },
      ],
    },
    {
      title: "HR & Employees",
      url: "/hr-employees",
      icon: Users,
      subMenu: [
        { title: "Employee Directory", url: "/employees" },
        { title: "Designations", url: "/designation" },
        { title: "Departments", url: "/department" },
        { title: "Job Listings", url: "/job-listings" },
        { title: "Roles & Permissions", url: "/access-control" },
        { title: "Task List", url: "/task-list" },
        { title: "Task Board", url: "/task-board" },
      ],
    },
    {
      title: "Web Settings",
      url: "/web-settings",
      icon: MonitorCog,
      subMenu: [
        { title: "Home Categories", url: "/home-category-image" },
        { title: "Trending Images", url: "/trending-image" },
        { title: "Carousels", url: "/trending-carousel" },
        { title: "Sliders", url: "/sliders" },
        { title: "Blog", url: "/blog" },
      ],
    },
    {
      title: "Admin Settings",
      url: "/admin-settings",
      icon: Settings,
      subMenu: [
        { title: "Company Profile", url: "/company-profile" },
        { title: "Global Settings", url: "/global-settings" },
        { title: "Domain Management", url: "/domain-management" },
        { title: "Number System", url: "/number-system" },
      ],
    },
    {
      title: "System Tools",
      url: "/system-tools",
      icon: Settings,
      subMenu: [
        { title: "Form Builder", url: "/form-builder" },
        { title: "Row Data", url: "/row-data" },
        { title: "Bug Reports", url: "/bug-report" },
        { title: "Change Log", url: "/change-log" },
      ],
    },
    {
      title: "Master Data",
      url: "/master",
      icon: BookText,
      subMenu: [
        { title: "Document Types", url: "/document-type" },
        { title: "Payment Terms", url: "/payment-terms" },
        { title: "Currency", url: "/currency" },
        { title: "Units", url: "/units" },
        { title: "Continents", url: "/continents" },
        { title: "Countries", url: "/countries" },
        { title: "Price List", url: "/price-list" },
        { title: "Documents List", url: "/document-list" },
        { title: "Export Mapping", url: "/export-mapping" },
      ],
    },
  ];

  // Sidebar Items
  const SidebarItem = ({ title, url, icon: Icon, subMenu }: NavTreeType) => {
    const activeLinkPath = usePathname();
    const [subMenuOpen, setSubMenuOpen] = useState(false);
    const toggleSubMenu = () => setSubMenuOpen((prev) => !prev);

    useEffect(() => {
      if (activeLinkPath?.includes(url)) setSubMenuOpen(true);
    }, [activeLinkPath, url]);
    return (
      <Box position="relative">
        {/* If there is no submenu  */}
        {!subMenu ? (
          <Link href={url ? url : "#"}>
            <Button
              width="100%"
              variant="ghost"
              fontSize="0.825rem"
              padding="0 10px"
              justifyContent="flex-start"
              alignItems="center"
              gap={4}
              borderColor="red.100"
              borderWidth={activeLinkPath === url ? 1 : 0}
              bgColor={activeLinkPath === url ? "red.50" : ""}
              color={activeLinkPath === url ? "red.600" : "gray.800"}
              _dark={{
                border: "none",
                bg: activeLinkPath === url ? "gray.800" : "",
                fontWeight: 800,
              }}
            >
              {Icon && <Icon size={18} style={{ width: "1.1rem" }} />}
              <Text fontWeight={500}>{title}</Text>
            </Button>
          </Link>
        ) : (
          <Button
            onClick={() => toggleSubMenu()}
            width="100%"
            variant="ghost"
            padding="0 10px"
            justifyContent="flex-start"
            alignItems="center"
            gap={4}
            fontSize="0.825rem"
            borderWidth={activeLinkPath?.includes(url) ? 1 : 0}
            borderColor="red.100"
            bg={activeLinkPath?.includes(url) ? "blue.50" : ""}
            color={activeLinkPath?.includes(url) ? "red.600" : "gray.800"}
            _dark={{
              border: "none",
              bg: activeLinkPath?.includes(url) ? "gray.800" : "",
              fontWeight: 800,
            }}
          >
            {Icon && <Icon style={{ width: "1.1rem" }} />}
            <Text fontWeight={500}>{title}</Text>
            <ChevronDown
              style={{ height: "15px", width: "15px" }}
              // transition/rotate 用 Chakra props
              transition="transform 0.2s"
              transform={subMenuOpen ? "rotate(180deg)" : undefined}
              position="absolute"
              right={2}
            />
          </Button>
        )}
        {/* Submenu  */}
        {subMenu && (
          <Box
            display="flex"
            flexDirection="column"
            transition="all 0.2s linear"
            overflow="hidden"
            maxH={subMenuOpen ? "24rem" : 0}
          >
            {subMenu.map((item, index) => {
              return (
                <Link key={index} href={url + item.url}>
                  <Button
                    variant="ghost"
                    width="100%"
                    padding="0 10px"
                    textAlign="left"
                    overflow="hidden"
                    justifyContent="flex-start"
                    alignItems="center"
                    gap={4}
                    fontSize="0.8rem"
                    color={
                      activeLinkPath?.includes(url + item.url)
                        ? "primary.600"
                        : ""
                    }
                  >
                    <Dot style={{ width: "1.1rem" }} />
                    <Text
                      fontWeight={500}
                      textOverflow="ellipsis"
                    >
                      {item.title}
                    </Text>
                  </Button>
                </Link>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      borderRightWidth={1}
      p={2}
      // rounded="md"
      bg="white"
      _dark={{
        bg: "transparent",
      }}
      borderWidth={1}
      borderTopWidth={0}
      className="text-sm min-w-[250px] overflow-y-auto overflow-x-hidden"
    >
      <Wrap alignItems="center" gap={3}>
        <Image src="/logo.svg" height={11} />
      </Wrap>
      <br />
      {navTree.map((nav, index) => (
        <div key={index} className="">
          <SidebarItem
            url={nav.url}
            title={nav.title}
            icon={nav.icon}
            subMenu={nav.subMenu}
          />
        </div>
      ))}
    </Box>
  );
};

export default memo(Sidebar);
