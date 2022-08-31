import React from 'react'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import App from '../App.js'
import * as useFetch from '../useFetch.js'

jest.mock('../useFetch.js')

test('this is the first test', () => {
	mockGet.mockResolvedValueOnce({value: 1})
	const user = userEvent.setup()
	render(<App />)
	expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
	expect(screen.getByText(/Home/i)).toBeInTheDocument()
	expect(screen.getByRole('link', {name: /Cart/i})).toBeInTheDocument()
	const shopping = screen.getByRole('link', { name: /shopping/i })
	
	user.click(shopping)
	expect(screen.getByText(/Online shopping simplified/i)).toBeInTheDocument()
	expect(screen.getByText(/Home/i)).toBeInTheDocument()
	expect(screen.getByRole('link', {name: /Cart/i})).toBeInTheDocument()

})
