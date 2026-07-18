import { useEffect, useRef, useState } from "react";
import {
  AccountCircle,
  Apps,
  AssignmentTurnedIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Dashboard,
  DarkMode,
  InstallMobile,
  ViewKanban,
  LightMode,
  Logout,
  Menu as MenuIcon,
  NotificationsActive,
  NotificationsOff,
  PeopleAlt,
  Search,
  Settings,
  Person
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { logoutLocal } from "../features/authSlice.js";
import { setDarkMode, setSidebarCollapsed } from "../features/uiSlice.js";
import { useLogoutMutation, useNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useSearchQuery, useInvitationsQuery, useAcceptInvitationMutation, useRejectInvitationMutation } from "../features/api.js";

const expandedWidth = 260;
const collapsedWidth = 72;

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Dashboard },
  { to: "/apps", label: "Apps", icon: Apps },
  { to: "/milestones", label: "Milestones", icon: AssignmentTurnedIn },
  { to: "/tasks", label: "Tasks", icon: CheckCircle },
  { to: "/kanban", label: "Kanban", icon: ViewKanban },
];

export function AppLayout() {
  const user = useAppSelector((state) => state.auth.user);
  const bootstrapped = useAppSelector((state) => state.auth.bootstrapped);
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const darkMode = useAppSelector((state) => state.ui.darkMode);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 760px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logout] = useLogoutMutation();
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: searchResults } = useSearchQuery({ q: searchQ }, { skip: searchQ.length < 2 });
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const { data: notifData } = useNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [inviteAnchor, setInviteAnchor] = useState<HTMLElement | null>(null);
  const { data: inviteData } = useInvitationsQuery();
  const [acceptInvite] = useAcceptInvitationMutation();
  const [rejectInvite] = useRejectInvitationMutation();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => setInstallPrompt(null);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", handler); window.removeEventListener("appinstalled", installed); };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    (installPrompt as Event & { prompt: () => Promise<void> }).prompt();
    const result = await (installPrompt as Event & { userChoice: Promise<{ outcome: string }> }).userChoice;
    if (result.outcome === "accepted") setInstallPrompt(null);
  }

  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      /* ignore */
    }
    dispatch(logoutLocal());
    navigate("/login");
  }

  if (!bootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;

  const drawerWidth = collapsed || isMobile ? collapsedWidth : expandedWidth;

  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ minHeight: 72, gap: 1.5, px: 2.5 }}>
        <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.main", fontWeight: 800 }}>A</Avatar>
        {!collapsed && !isMobile && (
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1 }}>AppVault</Typography>
            <Typography variant="caption" color="text.secondary">Portfolio manager</Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {nav.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              minHeight: 46,
              mb: 0.5,
              borderRadius: 2,
              color: "text.secondary",
              "&.active": {
                bgcolor: "primary.main", color: "#fff",
                boxShadow: "0 8px 18px rgba(25, 118, 210, 0.18)",
                "& .MuiListItemIcon-root": { color: "#fff" }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 42, color: "text.secondary" }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            {(!collapsed || isMobile) && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={(e) => setUserMenuAnchor(e.currentTarget)}
          sx={{ borderRadius: 2, minHeight: 46 }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 42, color: "text.secondary" }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: "secondary.main", fontSize: 14 }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Person fontSize="small" />}
            </Avatar>
          </ListItemIcon>
          {(!collapsed || isMobile) && (
            <ListItemText primary={user?.name ?? user?.email} primaryTypographyProps={{ fontSize: 14, fontWeight: 600, noWrap: true }} />
          )}
        </ListItemButton>
      </Box>
      <Menu
        anchorEl={userMenuAnchor}
        open={!!userMenuAnchor}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/profile"); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/settings"); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ "& .MuiDrawer-paper": { width: expandedWidth } }}>
          {sidebarContent}
        </Drawer>
      ) : (
        <Box sx={{
          width: drawerWidth, flexShrink: 0, height: "100vh", position: "fixed",
          bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider",
          transition: "width 180ms ease", zIndex: 1200
        }}>
          {sidebarContent}
        </Box>
      )}

      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          left: isMobile ? 0 : drawerWidth,
          width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
          borderBottom: "1px solid", borderColor: "divider",
          transition: "all 180ms ease"
        }}
      >
        <Toolbar sx={{ minHeight: 72, justifyContent: "space-between", px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            {isMobile ? (
              <IconButton onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
            ) : (
              <IconButton onClick={() => dispatch(setSidebarCollapsed(!collapsed))}>
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </IconButton>
            )}
            <TextField
              inputRef={searchRef}
              size="small"
              placeholder="Search..."
              value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(e.target.value.length >= 2); }}
              onFocus={() => setSearchOpen(searchQ.length >= 2)}
              slotProps={{ input: { startAdornment: <Search fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />, sx: { borderRadius: 2, bgcolor: "action.hover", width: { xs: 160, sm: 260 } } } }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight={700}>{user.name ?? user.email}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.main" }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <AccountCircle />}
            </Avatar>
            <IconButton onClick={(e) => setInviteAnchor(e.currentTarget)} title={inviteData && inviteData.invitations.length > 0 ? `${inviteData.invitations.length} pending invite(s)` : "Invitations"}>
              <PeopleAlt fontSize="small" color={inviteData && inviteData.invitations.length > 0 ? "primary" : undefined} />
            </IconButton>
            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} title="Notifications">
              {notifData && notifData.unread > 0 ? <NotificationsActive fontSize="small" color="primary" /> : <NotificationsOff fontSize="small" />}
            </IconButton>
            {installPrompt && (
              <IconButton onClick={handleInstall} title="Install AppVault">
                <InstallMobile fontSize="small" color="primary" />
              </IconButton>
            )}
            <IconButton onClick={() => dispatch(setDarkMode(!darkMode))} title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
            <IconButton onClick={handleLogout} title="Log out">
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
        {searchOpen && searchResults && (
          <Paper sx={{ position: "absolute", left: { xs: 8, sm: 24 }, top: 64, width: { xs: "calc(100% - 16px)", sm: 420 }, maxHeight: 400, overflow: "auto", zIndex: 1300, boxShadow: 4, borderRadius: 2 }} elevation={4}>
            <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
              <Box sx={{ p: 1.5 }}>
                {searchResults.apps.length === 0 && searchResults.tasks.length === 0 && searchResults.vault.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No results</Typography>
                )}
                {searchResults.apps.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 1, py: 0.5, display: "block" }}>Apps</Typography>
                    {searchResults.apps.map((app) => (
                      <ListItemButton key={app.id} sx={{ borderRadius: 1 }} onClick={() => { setSearchOpen(false); navigate(`/apps/${app.id}`); }}>
                        <ListItemText primary={app.name} secondary={app.type} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                      </ListItemButton>
                    ))}
                  </Box>
                )}
                {searchResults.tasks.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 1, py: 0.5, display: "block" }}>Tasks</Typography>
                    {searchResults.tasks.map((task) => (
                      <ListItemButton key={task.id} sx={{ borderRadius: 1 }} onClick={() => { setSearchOpen(false); navigate(`/apps/${task.appId}`); }}>
                        <ListItemText primary={task.title} secondary={task.appName} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                      </ListItemButton>
                    ))}
                  </Box>
                )}
                {searchResults.vault.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 1, py: 0.5, display: "block" }}>Vault</Typography>
                    {searchResults.vault.map((entry) => (
                      <ListItemButton key={entry.id} sx={{ borderRadius: 1 }} onClick={() => { setSearchOpen(false); navigate(`/apps/${entry.appId}`); }}>
                        <ListItemText primary={entry.label} secondary={`${entry.appName} · ${entry.provider}`} primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
                      </ListItemButton>
                    ))}
                  </Box>
                )}
              </Box>
            </ClickAwayListener>
          </Paper>
        )}
      </AppBar>

      <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)} slotProps={{ paper: { sx: { width: 360, maxHeight: 400 } } }}>
        {notifData && notifData.unread > 0 && (
          <MenuItem dense onClick={() => { markAllRead(); setNotifAnchor(null); }} sx={{ justifyContent: "center", color: "primary.main", fontWeight: 600 }}>
            Mark all read
          </MenuItem>
        )}
        {notifData?.notifications.map((n) => (
          <MenuItem key={n.id} dense sx={{ flexDirection: "column", alignItems: "flex-start", opacity: n.read ? 0.6 : 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Typography variant="body2" fontWeight={n.read ? 400 : 700}>{n.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", flexShrink: 0 }}>{new Date(n.createdAt).toLocaleDateString()}</Typography>
            </Box>
            {n.body && <Typography variant="caption" color="text.secondary">{n.body}</Typography>}
            {!n.read && <Button size="small" sx={{ mt: 0.5, alignSelf: "flex-end" }} onClick={() => markRead(n.id)}>Dismiss</Button>}
          </MenuItem>
        ))}
        {notifData && notifData.notifications.length === 0 && (
          <MenuItem disabled><Typography variant="body2" color="text.secondary">No notifications</Typography></MenuItem>
        )}
      </Menu>

      <Menu anchorEl={inviteAnchor} open={!!inviteAnchor} onClose={() => setInviteAnchor(null)} slotProps={{ paper: { sx: { width: 360, maxHeight: 400 } } }}>
        {inviteData && inviteData.invitations.length === 0 && (
          <MenuItem disabled><Typography variant="body2" color="text.secondary">No pending invitations</Typography></MenuItem>
        )}
        {inviteData?.invitations.map((inv) => (
          <MenuItem key={inv.id} dense sx={{ flexDirection: "column", alignItems: "flex-start" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <PeopleAlt fontSize="small" color="disabled" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{inv.app?.name ?? "Unknown app"}</Typography>
                <Typography variant="caption" color="text.secondary">Invited by {inv.invitedBy?.name ?? inv.invitedBy?.email}</Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 1, alignSelf: "flex-end" }}>
              <Button size="small" variant="contained" onClick={() => { acceptInvite(inv.id); setInviteAnchor(null); }}>Accept</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => { rejectInvite(inv.id); }}>Decline</Button>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      <Box component="main" sx={{ ml: isMobile ? 0 : `${drawerWidth}px`, pt: "96px", px: { xs: 1.5, sm: 2, md: 3 }, pb: 4, width: "100%", maxWidth: "100vw", overflow: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
}