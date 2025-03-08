import PropTypes from 'prop-types';

export const AlmoxarifadoManagerPropTypes = {
  excipientes: PropTypes.arrayOf(PropTypes.string),
  materiaisNaArea: PropTypes.object,
  faltaSolicitar: PropTypes.object,
  onUpdateSolicitacao: PropTypes.func
};

export const AlmoxarifadoManagerDefaultProps = {
  excipientes: [],
  materiaisNaArea: {},
  faltaSolicitar: {},
  onUpdateSolicitacao: () => {}
};
