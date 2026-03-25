/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';
import InfoIcon from '../assets/Images/CommonImages/InfoIcon.svg';

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} componentsProps={{ tooltip: { className } }} />
))`
  background: #c64091;
  width: 200px;
`;

const toolTextStyle = {
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '10px',
  lineHeight: '13px',
  color: '#fff',
  textAlign: 'center',
  cursor: 'pointer',
};

const ToolTip = React.memo((props) => (
  <CustomTooltip
    title={<Typography sx={toolTextStyle}>{props.info}</Typography>}
    TransitionComponent={Fade}
    TransitionProps={{ timeout: 400 }}
  >
    <Box
      component="img"
      src={InfoIcon}
      sx={{ width: '18px', height: 'auto', cursor: 'pointer', ...(props.sx || {}) }}
    />
  </CustomTooltip>
));

ToolTip.displayName = 'ToolTip';

export default ToolTip;
