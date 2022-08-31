import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../Home.js'

test('this is the first test', () => {
	render(<Home />)
	//expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
})
