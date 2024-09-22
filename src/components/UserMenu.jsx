import React, { useState } from 'react';
import { Button, Menu, MenuItem, Avatar, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';

export default function UserMenu({ user, onUserUpdate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [username, setUsername] = useState(user.user_metadata?.username || '');
  const router = useRouter();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    handleClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSaveUsername = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: { username: username }
    });

    if (error) {
      console.error('Erro ao atualizar o nome de usuário:', error);
    } else {
      onUserUpdate(data.user);
      handleCloseDialog();
    }
  };

  const displayName = user.user_metadata?.username || user.email;

  return (
    <>
      <Button color="inherit" onClick={handleMenu}>
        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{displayName[0].toUpperCase()}</Avatar>
        <Typography variant="body2">{displayName}</Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleOpenDialog}>Adicionar/Editar Nome de Usuário</MenuItem>
        <MenuItem onClick={handleLogout}>Deslogar</MenuItem>
      </Menu>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Adicionar/Editar Nome de Usuário</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="username"
            label="Nome de Usuário"
            type="text"
            fullWidth
            variant="standard"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUsername}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
