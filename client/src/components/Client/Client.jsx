import React from 'react'
import Avatar from 'react-avatar';//Avatar library
import './Client.css'

const Client = ({username}) => {
  return (
    <div className='client'>
        <Avatar name={username} size={50} round="14px" />
        <span>{username}</span>
    </div>
  )
}

export default Client