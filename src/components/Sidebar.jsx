import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Scale as ScaleIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { styled } from "@mui/material/styles";

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-start",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Sidebar = ({ open, toggleDrawer }) => {
  const menuItems = [
    { text: "Início", icon: <HomeIcon />, path: "/" },
    { text: "Pesagem", icon: <ScaleIcon />, path: "#" },
    { text: "Rejunka Dashboard", icon: <DashboardIcon />, path: "#" },
    { text: "Configurações", icon: <SettingsIcon />, path: "#" },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={toggleDrawer(false)}
      PaperProps={{
        sx: {
          width: 240,
          backgroundColor: "background.default",
        },
      }}
    >
      <DrawerHeader>
        <IconButton color="inherit" onClick={toggleDrawer(false)} edge="start">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, fontWeight: "bold" }}>
          Menu
        </Typography>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <Link href={item.path} key={item.text} passHref>
            <StyledListItem button component="a">
              <ListItemIcon sx={{ color: "primary.main" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: "medium",
                  color: "text.primary",
                }}
              />
            </StyledListItem>
          </Link>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
