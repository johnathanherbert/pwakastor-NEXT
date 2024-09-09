import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Scale as ScaleIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import Link from "next/link";

const Sidebar = ({ open, toggleDrawer }) => {
  const menuItems = [
    { text: "Início", icon: <HomeIcon />, path: "/" },
    { text: "Pesagem", icon: <ScaleIcon />, path: "#" },
    { text: "Rejunka Dashboard", icon: <DashboardIcon />, path: "#" },
    { text: "Configurações", icon: <SettingsIcon />, path: "#" },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
      <div
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List>
          {menuItems.map((item, index) => (
            <Link href={item.path} key={item.text} passHref>
              <ListItem button component="a">
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            </Link>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default Sidebar;
