/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';
import InfoIcon from '../assets/Images/CommonImages/InfoIcon.svg';

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} componentsProps={{ tooltip: { className } }} />
))`
  background: #7a1f5c;
  max-width: 280px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(15, 23, 42, 0.22);
  font-family: Inter, sans-serif;
`;

const toolTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#fff',
  textAlign: 'left',
  cursor: 'default',
};

const ToolTip = React.memo((props) => (
  <CustomTooltip
    title={<Typography sx={toolTextStyle}>{props.info}</Typography>}
    TransitionComponent={Fade}
    TransitionProps={{ timeout: 200 }}
    enterTouchDelay={0}
    leaveTouchDelay={4000}
  >
    <Box
      component="img"
      src={InfoIcon}
      alt=""
      role="presentation"
      sx={{
        width: 18,
        height: 18,
        cursor: 'pointer',
        opacity: 0.9,
        verticalAlign: 'middle',
        transition: 'opacity 0.15s ease',
        '&:hover': { opacity: 1 },
        ...(props.sx || {}),
      }}
    />
  </CustomTooltip>
));

ToolTip.displayName = 'ToolTip';

export default ToolTip;
